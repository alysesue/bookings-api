export function mockConfig() {
	jest.mock('../../config/app-config.ts', () => {
		return {
			getConfig: () => ({
				name: 'test',
				version: '0.1',
				port: 3000,
				env: 'production',
				database: {
					host: 'host',
					port: '1111',
					instance: 'database',
					username: 'user',
					password: '',
				},
			}),
		};
	});
}

mockConfig();
