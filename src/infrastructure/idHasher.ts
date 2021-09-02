import { Singleton } from 'typescript-ioc';
import { getConfig } from '../config/app-config';
const Hashids = require('hashids/cjs');

type HashIdsClassType = {
	encode(input: number[]): string;
	decode(input: string): number[];
};

// DON'T change this value
const MIN_ID_LENGTH = 8;

@Singleton
export class IdHasher {
	private readonly _hashIds: HashIdsClassType;

	private constructor() {
		const config = getConfig();
		this._hashIds = new Hashids(config.hashIdSalt, MIN_ID_LENGTH);
	}

	public encode(id?: number): string | undefined {
		if (id === undefined) {
			return undefined;
		}

		if (id === null) {
			return null;
		}

		return this._hashIds.encode([id]);
	}

	public decode(value?: string): number | undefined {
		if (value === undefined) {
			return undefined;
		}

		if (value === null) {
			return null;
		}

		const decoded = this._hashIds.decode(value);
		return decoded.length > 0 ? decoded[0] : null;
	}
}
