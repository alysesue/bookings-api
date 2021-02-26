export const isEmptyArray = (array: any[]) => {
	return Array.isArray(array) && array.length === 0;
};

export const pushIfNotPresent = (array: string[], newItem: string) => {
	if (array.indexOf(newItem) === -1) array.push(newItem);
	return array;
};
