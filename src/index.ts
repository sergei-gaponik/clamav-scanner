import express from 'express'
import NodeClam from 'clamscan'
import { scanHandler } from './routes/scan'
import { scanAsyncHandler } from './routes/scanAsync'
import { scanStatusHandler } from './routes/scanStatus'

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

		// Register routes
		app.post('/scan', scanHandler(clamAV))
		app.post('/scan-async', scanAsyncHandler(clamAV))
		app.get('/status/:requestId', scanStatusHandler())

		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`)
		})
	})
	.catch(error => {
		console.error('Server startup failed:', error)
		process.exit(1)
	})
