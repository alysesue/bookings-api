export function tryParseInt(value: string): number | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	try {
		const parsed = Number.parseInt(value, 10);
		if (isNaN(parsed)) {
			return undefined;
		}
		return parsed;
	} catch {
		return undefined;
	}
}

export const isNumeric = (value: string): boolean => {
	return /^-?\d+$/.test(value);
};
