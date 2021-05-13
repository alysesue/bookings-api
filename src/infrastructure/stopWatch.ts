import * as v8 from 'v8';
import { logger } from 'mol-lib-common';

export class StopWatch {
	private _name: string;
	private _initial?: Date;
	private _initialMemoryAvailKB?: number;
	private _endMemoryMemoryAvailKB?: number;
	private _end?: Date;

	constructor(name: string, start = true) {
		this._name = name;
		if (start) {
			this.start();
		}
	}

	public start() {
		this._initial = new Date();
		const memory = v8.getHeapStatistics();
		this._initialMemoryAvailKB = memory.total_available_size  / 1024;
	}


	public stop(log= true) {
		const memory = v8.getHeapStatistics();
		this._endMemoryMemoryAvailKB = memory.total_available_size  / 1024;
		this._end = new Date();
		if (log) {
			this.log();
		}
	}

	public log() {
		if (!this._initial) {
			logger.info(`[StopWatch - ${this._name}] Not started.`);
		}
		if (this._end) {
			const elapsed = this._end.getTime() - this._initial.getTime();
			const memoryAlloc = (this._initialMemoryAvailKB - this._endMemoryMemoryAvailKB).toFixed(3);

			logger.info(`[StopWatch - ${this._name}] Ended at ${this._end.toLocaleString()}. Elapsed: ${elapsed} ms; MemoryAlloc: ${memoryAlloc} KB; MemoryAvailable: ${this._endMemoryMemoryAvailKB.toFixed(3)} KB`);
		} else {
			const elapsed = new Date().getTime() - this._initial.getTime();
			logger.info(`[StopWatch - ${this._name}] Running: ${elapsed} ms.`);
		}
	}
}
