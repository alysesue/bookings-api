"use strict";
// =============================================================================
// This creates a base library webpack config
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const base_webpack_config_1 = require("./base.webpack.config");
// =============================================================================
// Config
// =============================================================================
exports.createBaseK6Config = (config) => {
    const k6Config = base_webpack_config_1.createBaseConfig(config);
    k6Config.mode = "production";
    // tslint:disable-next-line: tsr-detect-unsafe-regexp
    k6Config.externals = /k6(\/.*)?/;
    k6Config.target = "web";
    k6Config.output.libraryTarget = "commonjs";
    return k6Config;
};
