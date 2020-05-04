"use strict";
// =============================================================================
// This creates a base service webpack config
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const copyPlugin = require("copy-webpack-plugin");
const path = require("path");
const base_webpack_config_1 = require("./base.webpack.config");
// =============================================================================
// Config
// =============================================================================
exports.createBaseServiceConfig = (config) => {
    const serviceConfig = base_webpack_config_1.createBaseConfig(config);
    serviceConfig.plugins.push(new copyPlugin([{
            from: path.resolve(config.dir, "configs/shared-config/service.node12.dockerfile"),
            to: "./Dockerfile",
            toType: "file",
        }]), new copyPlugin([{
            from: path.resolve(config.dir, "scripts"),
            to: "./scripts",
            toType: "dir",
        }]));
    // This is to include the security ejs files required for node-soap
    serviceConfig.module.rules.push({
        test: /\/?soap\/.+\.ejs$/,
        use: [{
                loader: "file-loader",
                options: {
                    name: "[name].[ext]",
                    outputPath: "./templates",
                },
            }],
    });
    return serviceConfig;
};
