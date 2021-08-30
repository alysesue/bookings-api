export function andWhere(conditions: string[]): string {
	return conditions
		.map((c) => c.trim())
		.filter((c) => c)
		.map((c) => `(${c})`)
		.join(' AND ');
}
export function orWhere(conditions: string[]): string {
	return conditions
		.map((c) => c.trim())
		.filter((c) => c)
		.map((c) => `(${c})`)
		.join(' OR ');
}
