import type { ScanResult } from '../types'

export type ScanStatus = 'pending' | 'completed' | 'failed'

export interface ScanRecord {
	status: ScanStatus
	result?: ScanResult
	error?: string
	startedAt: Date
}

class ScanStore {
	private scans: Map<string, ScanRecord> = new Map()

	createScan(requestId: string): void {
		this.scans.set(requestId, {
			status: 'pending',
			startedAt: new Date(),
		})
	}

	updateScan(requestId: string, update: Partial<ScanRecord>): void {
		const current = this.scans.get(requestId)
		if (current) {
			this.scans.set(requestId, { ...current, ...update })
		}
	}

	getScan(requestId: string): ScanRecord | undefined {
		return this.scans.get(requestId)
	}

	// Optional: Clean up old scans periodically
	cleanup(maxAgeMs: number = 1000 * 60 * 60): void {
		const now = new Date()
		for (const [id, scan] of this.scans.entries()) {
			if (now.getTime() - scan.startedAt.getTime() > maxAgeMs) {
				this.scans.delete(id)
			}
		}
	}
}

export const scanStore = new ScanStore()
