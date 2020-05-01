// =============================================================================
// This creates a base jest config
// =============================================================================

exports.TestType = {
	UNIT_AND_INTERGRATION: "UNIT_AND_INTERGRATION",
	BENCHMARK: "BENCHMARK",
	EXTERNAL: "EXTERNAL",
	FUNCTIONAL: "FUNCTIONAL",
};

exports.createBaseConfig = (testType) => {
	const testMatch = getTestMatch(testType);
	const maxConcurrency = getMaxConcurrency(testType);
	const coverageConfig = getCoverageConfig(testType);

	const config = {
		testMatch,
		maxConcurrency,
		...coverageConfig,
		transform: {
			".(js|ts|jsx|tsx)$": "ts-jest",
		},
		modulePaths: [
			"src",
		],
		moduleFileExtensions: [
			"js",
			"ts",
			"jsx",
			"tsx",
		],
		testResultsProcessor: "./node_modules/jest-bamboo-formatter",
		verbose: true,
		bail: true,
	};

	return config;
};

function getTestMatch(testType) {
	switch (testType) {
		case exports.TestType.UNIT_AND_INTERGRATION:
			return [
				`<rootDir>/src/**/__tests__/**/*.spec.(js|ts)?(x)`,
				`<rootDir>/src/**/__tests__/**/*.super.spec.(js|ts)?(x)`,
				"!**/*.bench.spec.(js|ts)?(x)",
			];

		case exports.TestType.BENCHMARK:
			return [`<rootDir>/src/**/__tests__/**/*.bench.spec.(js|ts)?(x)`];

		case exports.TestType.EXTERNAL:
			return [`<rootDir>/src/**/__tests__/**/*.ext.spec.(js|ts)?(x)`];

		case exports.TestType.FUNCTIONAL:
			return [`<rootDir>/__tests__/functional/**/*.spec.(js|ts)?(x)`];

		// FIXME: Backwards compatibility
		default:
			// tslint:disable-next-line: no-console
			console.warn("Unknown Jest testType");
			return [
				`<rootDir>/src/**/__tests__/**/*.spec.(js|ts)?(x)`,
				`<rootDir>/src/**/?(*.)(spec|unit|test).(js|ts)?(x)`, // Backwards compatibility
			];
	}
}

function getMaxConcurrency(testType) {
	switch (testType) {
		case exports.TestType.BENCHMARK:
			return 1;

		default:
			return 10;
	}
}

function getCoverageConfig(testType) {
	const coverageConfig = {};

	if (testType === exports.TestType.UNIT_AND_INTERGRATION) {
		Object.assign(coverageConfig, {
			collectCoverageFrom: [
				"<rootDir>/src/**/*.{js,jsx,ts,tsx}",
				// Generic exclusions
				"!**/__tests__/**/*",
				"!**/*{M,m}ock{*,*/**/*}",
				"!**/*{E,e}num{*,*/**/*}",
				"!**/*{T,t}emp{*,*/**/*}",
				"!**/*{E,e}xample{*,*/**/*}",
				"!**/*{S,s}ample{*,*/**/*}",
				"!**/*{C,c}ontroller{*,*/**/*}",
				"!**/*{D,d}eprecated{*,*/**/*}",
				"!**/*{M,m}igration{*,*/**/*}",
				"!**/{I,i}ndex.*",
				// Specific exclusions
				"!<rootDir>/src/routes.ts",
				"!<rootDir>/src/server.ts",
				"!<rootDir>/src/config/**/*",
				"!<rootDir>/src/health/**/*",
			],
			coverageDirectory: "<rootDir>/coverage",
			coverageReporters: ["text"],
		});
	}

	return coverageConfig;
}
