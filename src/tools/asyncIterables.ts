export async function* concatIteratables<T>(...iterables: AsyncIterable<T>[]): AsyncIterable<T> {
	for (const i of iterables) yield* i;
}

export async function iterableToArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
	const arr: T[] = [];
	for await (const e of iterable) {
		arr.push(e);
	}
	return arr;
}
