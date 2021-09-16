export const isEmptyArray = (array: any[]) => {
	return Array.isArray(array) && array.length === 0;
};

export const pushIfNotPresent = (array: string[], newItem: string) => {
	if (array.indexOf(newItem) === -1) array.push(newItem);
	return array;
};

export const randomIndex = (array: any[]) => Math.floor(Math.random() * array.length);

export const uniqBy = <T = unknown>(a: T[], key: (a: T) => any) => {
	const seen = {};
	return a.filter(function (item) {
		const k = key(item);
		// eslint-disable-next-line no-prototype-builtins
		return seen.hasOwnProperty(k) ? false : (seen[k] = true);
	});
};
