import { Request, Response } from 'express'
import type NodeClam from 'clamscan'
import crypto from 'crypto'
import { scanStore } from '../services/scanStore'
import { performScan } from '../operations/performScan'

// Asynchronous scan handler
export function scanAsyncHandler(clamAV: NodeClam) {
	return async function (req: Request, res: Response) {
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

			// Create scan record
			scanStore.createScan(requestId)

			// Return the request ID immediately
			res.json({ requestId })

			// Perform scan in background
			performScan(downloadUrl, clamAV)
				.then(result => {
					scanStore.updateScan(requestId, {
						status: 'completed',
						result,
					})
					console.timeEnd(requestId)
				})
				.catch(error => {
					console.error('Async scan error:', error)
					scanStore.updateScan(requestId, {
						status: 'failed',
						error: error instanceof Error ? error.message : 'Unknown error',
					})
				})
		} catch (error) {
			console.error('Scan initialization error:', error)
			res.status(500).json({
				error: 'Failed to initialize scan',
				details: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	}
}

// Status check handler
export const scanStatusHandler = () => async (req: Request, res: Response) => {
	const { requestId } = req.params

	if (!requestId) {
		return res.status(400).json({ error: 'Request ID is required' })
	}

	const scanRecord = scanStore.getScan(requestId)

	if (!scanRecord) {
		return res.status(404).json({ error: 'Scan not found' })
	}

	res.json(scanRecord)
}
