import { Request, Response } from 'express'
import crypto from 'crypto'
import type NodeClam from 'clamscan'
import { performScan } from '../operations/performScan'

export function scanHandler(clamAV: NodeClam) {
	return async function (req: Request, res: Response) {
		const requestId = crypto.randomUUID()
		console.time(requestId)

		if (!clamAV) {
			return res.status(500).json({ error: 'ClamAV is not initialized' })
		}

		try {
			const result = await performScan(req.body, clamAV)
			console.timeEnd(requestId)
			res.json(result)
		} catch (error) {
			console.error('Scan error:', error)
			res.status(500).json({
				error: 'Failed to scan file',
				details: error instanceof Error ? error.message : 'Unknown error',
			})
		}
	}
}
