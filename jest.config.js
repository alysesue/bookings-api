const config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['<rootDir>/src/**/__tests__/**/*.spec.[jt]s?(x)'],
	maxConcurrency: 10,
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{js,jsx,ts,tsx}',
		'!**/*.d.ts',
		'!**/__tests__/**/*',
		'!**/*{M,m}ock{*,*/**/*}',
		'!**/*{E,e}num{*,*/**/*}',
		// '!**/*{T,t}emp{*,*/**/*}',
		'!**/*{E,e}xample{*,*/**/*}',
		'!**/*{S,s}ample{*,*/**/*}',
		'!**/*{C,c}ontroller{*,*/**/*}',
		'!**/*{D,d}eprecated{*,*/**/*}',
		'!**/*{M,m}igration{*,*/**/*}',
		'!**/*{E,e}ntity{*,*/**/*}',
		'!**/{I,i}ndex.*',
		'!<rootDir>/src/models/index.ts',
		'!<rootDir>/src/routes.ts',
		'!<rootDir>/src/server.ts',
		'!<rootDir>/src/config/**/*',
		'!<rootDir>/src/health/**/*',
		'**/*.controller.ts',
		'!**/*{A,a}picontract{*,*/**/*}',
		'!**/fixLF.js',
		'!**/authentication.ts',
		'!**/swagger.middleware.ts',
		'!**/transactionManager.ts',
		'!**/connectionOptions.ts',
		'!**/server.ts',
		'!**/stopWatch.ts',
		'!**/koaContextStore.middleware.ts',
		'!**/citizenUserValidation.middleware.ts',
		'!**/ormconfig.ts',
		'!**/bookingSGAuth.ts',
		'!**/db.connectionPool.ts',
	],
	coverageDirectory: '<rootDir>/coverage',
	coverageReporters: ['text'],
	modulePaths: ['src'],
	moduleFileExtensions: ['js', 'ts', 'jsx', 'tsx'],
	testResultsProcessor: '<rootDir>/node_modules/jest-bamboo-formatter',
	setupFiles: ['./jest.setup.ts'],
	verbose: true,
	bail: false,
	coverageThreshold: {
		global: { branches: 80, functions: 80, lines: 80, statements: 80 },
	},
};

module.exports = config;
