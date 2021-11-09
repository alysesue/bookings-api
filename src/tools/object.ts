import * as _ from 'lodash';

export function trimFields<T extends {}>(obj: T): T {
	if (!obj) {
		return obj;
	}

	for (const key of Object.keys(obj)) {
		const value = obj[key];
		if (typeof value === 'string') {
			obj[key] = value.trim();
		}
	}

	return obj;
}

export type ObjectType<T> = (new (..._params) => T) | Function;

// Only casts an object after performing an 'instance of' check
export function safeCast<T>(obj: Object | undefined, type: ObjectType<T>): T | undefined {
	if (_.isNil(obj)) {
		return obj;
	}

	if (obj instanceof type) {
		return obj as T;
	}

	throw new Error(`Object of type [${obj.constructor.name}] cannot be directly cast to [${type.name}]`);
}
