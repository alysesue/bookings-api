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
}
