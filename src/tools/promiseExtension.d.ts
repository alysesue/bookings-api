// Supported in Node.js >= 12.9.0
declare interface PromiseConstructor {
	allSettled(promises: Promise<any>[]): Promise<{ status: 'fulfilled' | 'rejected'; value?: any; reason?: any }[]>;
}
