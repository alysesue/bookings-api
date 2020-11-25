import { nextImmediateTick } from '../../infrastructure/immediateHelper';

export type ProcessorAction<K, V> = (kvp: [K, V]) => void;

const MaxLoopIterationCount = 1000;
export class MapProcessor<K, V> {
	private readonly _actions: ProcessorAction<K, V>[];

	constructor(...actions: ProcessorAction<K, V>[]) {
		this._actions = actions;
	}

	public async process(entries: Map<K, V>): Promise<void> {
		let counter = 0;
		const actionCount = this._actions.length;
		const actions = this._actions;
		for (const kvp of entries) {
			for (let i = 0; i < actionCount; i++) {
				// tslint:disable-next-line: tsr-detect-unsafe-properties-access
				actions[i](kvp);
			}
			if (counter++ > MaxLoopIterationCount) {
				counter = 0;
				await nextImmediateTick();
			}
		}
	}

	public static combine<K, V>(...processors: MapProcessor<K, V>[]): MapProcessor<K, V> {
		if (processors.length === 0) {
			throw new Error('Cannot combine empty list of map processors.');
		}
		if (processors.length === 1) {
			return processors[0];
		}

		const actions = processors.map((p) => p._actions).flat();
		return new MapProcessor<K, V>(...actions);
	}
}
