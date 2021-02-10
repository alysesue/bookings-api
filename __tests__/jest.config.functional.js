// =============================================================================
// This creates a base jest config
// =============================================================================

module.exports = {
	collectCoverageFrom: [
		"**/src/**/*.{js,jsx,ts,tsx}",
	],
	coverageReporters: ["text-summary"],
	coverageDirectory: "<rootDir>/__tests__/functional/coverage",
	transform: {
		".(js|ts|jsx|tsx)$": "ts-jest",
	},
	testMatch: [
		"<rootDir>/__tests__/**/*.(spec|unit|test).(js|ts)?(x)",
	],
	modulePaths: [
		"src",
	],
	moduleFileExtensions: [
		"js",
		"ts",
		"jsx",
		"tsx",
	],
	rootDir: "../",
	verbose: true,
	silent: false,
	bail: true,
	globalSetup: "./__tests__/jest-global-setup.js",
	setupFiles: ["./__tests__/jest.setup.js"],
	testTimeout: 10000
};
