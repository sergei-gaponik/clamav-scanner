import axios from 'axios'
import { tmpdir } from 'os'
import { join } from 'path'
import { createWriteStream } from 'fs'
import { unlink } from 'fs/promises'
import type { ScanResult } from '../types'
import type NodeClam from 'clamscan'

export async function performScan(downloadUrl: string, clamAV: NodeClam): Promise<ScanResult> {
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

	try {
		// Scan the file
		const { isInfected, viruses } = await clamAV.isInfected(tempFilePath)

		return {
			isClean: !isInfected,
			message: isInfected ? 'Malware detected' : 'File is clean',
			viruses: isInfected ? viruses : undefined,
		}
	} finally {
		// Delete temporary file
		await unlink(tempFilePath)
	}
}
