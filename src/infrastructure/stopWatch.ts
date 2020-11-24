import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';

export class StopWatch {
	private _name: string;
	private _initial?: Date;
	private _end?: Date;

	constructor(name: string, start: boolean = true) {
		this._name = name;
		if (start) {
			this.start();
		}
	}

	public start() {
		this._initial = new Date();
	}

	public stop(log: boolean = true) {
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
			logger.info(`[StopWatch - ${this._name}] Ended at ${this._end.toLocaleString()}. Elapsed: ${elapsed} ms.`);
		} else {
			const elapsed = new Date().getTime() - this._initial.getTime();
			logger.info(`[StopWatch - ${this._name}] Running: ${elapsed} ms.`);
		}
	}
}
