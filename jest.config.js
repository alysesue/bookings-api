const baseConfigModule = require('mol-lib-config/shared-config/jest.config')
const baseConfig = baseConfigModule.createBaseConfig(baseConfigModule.TestType.UNIT_AND_INTERGRATION)

const config = {
  ...baseConfig,
  setupFiles: ['./jest.setup.ts'],
  collectCoverageFrom: [
    ...baseConfig.collectCoverageFrom,
    '**/*.controller.ts',
    '!**/*{A,a}picontract{*,*/**/*}',
    '!**/fixLF.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = config;
