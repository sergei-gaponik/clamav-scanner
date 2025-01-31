import express from 'express'
import NodeClam from 'clamscan'
import axios from 'axios'
import { tmpdir } from 'os'
import { join } from 'path'
import { createWriteStream } from 'fs'
import { unlink } from 'fs/promises'
import crypto from 'crypto'
import type { ScanResult } from './types'

// Initialize ClamAV with better error handling
const initClamAV = async () => {
	try {
		// Start clamd service
		const ClamScan = await new NodeClam().init({
			removeInfected: false,
			quarantineInfected: false,
			debugMode: true,
			scanRecursively: true,
			clamscan: {
				path: '/usr/bin/clamscan',
				db: '/var/lib/clamav',
				scanArchives: true,
				active: false, // Disable command-line scanner
			},
			clamdscan: {
				socket: '/var/run/clamav/clamd.ctl', // Unix socket
				host: 'localhost',
				port: 3310,
				timeout: 60000,
				localFallback: true,
				path: '/usr/bin/clamdscan',
				configFile: '/etc/clamav/clamd.conf',
				multiscan: true,
				active: true, // Enable daemon mode
			},
			preference: 'clamdscan',
		})

		return ClamScan
	} catch (error) {
		console.error('Failed to initialize ClamAV:', error)
		throw new Error('ClamAV initialization failed. Please ensure ClamAV is installed and properly configured.')
	}
}

const app = express()
app.use(express.json())

let clamAV: NodeClam | null = null

// Initialize ClamAV before starting the server
initClamAV()
	.then(instance => {
		clamAV = instance
		const PORT = process.env.PORT || 3000
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`)
		})
	})
	.catch(error => {
		console.error('Server startup failed:', error)
		process.exit(1)
	})

app.post('/scan', async (req, res) => {
	const requestId = crypto.randomUUID()
	console.time(requestId)
	if (!clamAV) {
		return res.status(500).json({ error: 'ClamAV is not initialized' })
	}

	try {
		const { downloadUrl } = req.body

		if (!downloadUrl) {
			return res.status(400).json({ error: 'Download URL is required' })
		}

		// Download file
		const response = await axios({
			url: downloadUrl,
			method: 'GET',
			responseType: 'stream',
		})

		// Create temporary file path
		const tempFilePath = join(tmpdir(), `scan-${Date.now()}`)
		const writer = createWriteStream(tempFilePath)

		// Pipe the download to a temporary file
		await new Promise<void>((resolve, reject) => {
			response.data.pipe(writer)
			writer.on('finish', () => resolve())
			writer.on('error', reject)
		})

		// Scan the file
		const { isInfected, viruses } = await clamAV.isInfected(tempFilePath)

		// Delete temporary file
		await unlink(tempFilePath)

		const result: ScanResult = {
			isClean: !isInfected,
			message: isInfected ? 'Malware detected' : 'File is clean',
			viruses: isInfected ? viruses : undefined,
		}

		console.timeEnd(requestId)

		res.json(result)
	} catch (error) {
		console.error('Scan error:', error)
		res.status(500).json({
			error: 'Failed to scan file',
			details: error instanceof Error ? error.message : 'Unknown error',
		})
	}
})
