import axios from 'axios'
import { tmpdir } from 'os'
import { join } from 'path'
import { createWriteStream } from 'fs'
import { unlink } from 'fs/promises'
import type { ScanResult } from '../types'
import type NodeClam from 'clamscan'
import { AssertionError } from 'assert'
import assert from 'assert'

export async function performScan(input: { downloadUrl: string; authHeader: string }, clamAV: NodeClam): Promise<ScanResult> {
	try {
		assert(input.downloadUrl, 'Download URL is required')
		assert(typeof input.downloadUrl === 'string', 'Download URL must be a string')
		assert(new URL(input.downloadUrl), 'Download URL must be a valid URL')
		if (input.authHeader !== undefined) {
			assert(typeof input.authHeader === 'string', 'Auth header must be a string')
		}
	} catch (e: unknown) {
		if (e instanceof AssertionError) {
			throw new Error(e.message)
		}
		throw e
	}

	const response = await axios({
		url: input.downloadUrl,
		method: 'GET',
		responseType: 'stream',
		headers: {
			Authorization: input.authHeader,
		},
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
