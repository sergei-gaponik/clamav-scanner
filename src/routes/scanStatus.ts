import { Request, Response } from 'express'
import { scanStore } from '../services/scanStore'

export function scanStatusHandler() {
	return async function (req: Request, res: Response) {
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
}
