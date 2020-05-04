const baseConfigModule = require("./configs/shared-config/jest.config");
const baseConfig = baseConfigModule.createBaseConfig(baseConfigModule.TestType.UNIT_AND_INTERGRATION)

const config = {
	...baseConfig,
	setupFiles: ["./jest.setup.ts"],
	collectCoverageFrom: [
		...baseConfig.collectCoverageFrom,
		"!**/*{A,a}picontract{*,*/**/*}"
	],
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
