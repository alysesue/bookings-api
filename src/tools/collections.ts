export function groupByKey<TKey, TValue>(elements: TValue[], keySelector: (value: TValue) => TKey): Map<TKey, TValue[]> {
	const initial = new Map<TKey, TValue[]>();
	if (!elements) {
		return initial;
	}

	const result = elements.reduce((map, current) => {
		const key = keySelector(current);
		const groupCollection = map.get(key) || [];
		groupCollection.push(current);

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
