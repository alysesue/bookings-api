import { values } from "lodash";

export type Selector<TOrigin, TDest> = (origin: TOrigin) => TDest;

export function groupByKey<TKey, TValue>(elements: TValue[], keySelector: Selector<TValue, TKey>): Map<TKey, TValue[]> {
	return groupByKeyValue(elements, keySelector, (v) => v);
}

export function groupByKeyValue<TElement, TKey, TValue>(elements: TElement[], keySelector: Selector<TElement, TKey>, valueSelector: Selector<TElement, TValue>): Map<TKey, TValue[]> {
	const initial = new Map<TKey, TValue[]>();
	if (!elements) {
		return initial;
	}

	const result = elements.reduce((map, current) => {
		const key = keySelector(current);
		const value = valueSelector(current);
		const groupCollection = map.get(key) || [];
		groupCollection.push(value);

		map.set(key, groupCollection);
		return map;
	}, initial);

	return result;
}

export function groupByKeyLastValue<TKey, TValue>(elements: TValue[], keySelector: (value: TValue) => TKey): Map<TKey, TValue> {
	const initial = new Map<TKey, TValue>();
	if (!elements) {
		return initial;
	}

	const result = elements.reduce((map, current) => {
		const key = keySelector(current);
		map.set(key, current);
		return map;
	}, initial);

	return result;
}
