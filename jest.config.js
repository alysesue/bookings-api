const baseConfig = require("mol-lib-config/shared-config/jest.config");

const config = {
	...baseConfig.createBaseConfig(baseConfig.TestType.UNIT_AND_INTERGRATION),
	setupFiles: ["./jest.setup.ts"],
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},
};

module.exports = config;
