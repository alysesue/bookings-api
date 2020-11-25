export const nextImmediateTick = (): Promise<void> => {
	return new Promise<void>((r) => setImmediate(r));
};
