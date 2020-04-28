const baseConfig = require("mol-lib-config/shared-config/jest.config");

const config = {
	...baseConfig.createBaseConfig(baseConfig.TestType.FUNCTIONAL),
	setupFiles: ["./jest.setup.ts"],
};

module.exports = config;
