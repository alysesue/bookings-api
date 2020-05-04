"use strict";
// =============================================================================
// This creates a base service webpack config
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const CircularDependencyPlugin = require("circular-dependency-plugin");
const clean_webpack_plugin_1 = require("clean-webpack-plugin");
const copyPlugins = require("copy-webpack-plugin");
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
// =============================================================================
// Env inputs
// =============================================================================
const buildEnv = process.env.BUILD_ENV || "development";
// =============================================================================
// Custom Plugins
// =============================================================================
class FixScriptPermissionsPlugin {
    constructor(distScriptPath) {
        this.distScriptPath = distScriptPath;
    }
    // tslint:disable: tsr-detect-non-literal-fs-filename no-console
    apply(compiler) {
        compiler.hooks.afterEmit.tap("FixScriptPermissionsPlugin", () => {
            // Check if path exists
            if (!fs.existsSync(this.distScriptPath)) {
                console.warn(`${this.distScriptPath} does not exist.`);
                return;
            }
            // Single script file
            if (fs.lstatSync(this.distScriptPath).isFile()) {
                fs.chmodSync(this.distScriptPath, 0o755);
            }
            // Script dir
            const files = fs.readdirSync(this.distScriptPath);
            files.forEach((file) => {
                fs.chmodSync(path.resolve(this.distScriptPath, file), 0o755);
            });
        });
    }
}
// =============================================================================
// Config
// =============================================================================
exports.createBaseConfig = (config) => {
    // Defaults
    config.outDir = config.outDir || config.dir;
    config.cleanPlugin = config.cleanPlugin || new clean_webpack_plugin_1.CleanWebpackPlugin();
    // Parse paths
    config.outDir = path.resolve(config.outDir, "dist");
    return {
        mode: buildEnv,
        entry: path.resolve(config.dir, "src/index.ts"),
        externals: [nodeExternals({
                whitelist: [/util\/.*/],
            })],
        target: "node",
        devtool: "source-map",
        output: {
            filename: "index.js",
            devtoolModuleFilenameTemplate: "../[resource-path]",
            path: config.outDir,
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
            modules: [path.resolve(config.dir, "src"), `node_modules`],
        },
        optimization: {
            usedExports: true,
        },
        plugins: [
            new webpack.ProgressPlugin(),
            config.cleanPlugin,
            new webpack.DefinePlugin({
                "global.GENTLY": false,
            }),
            new copyPlugins([
                { from: "./package.json", to: "./" },
                { from: "./package-lock.json", to: "./" },
            ]),
            new CircularDependencyPlugin({
                exclude: /a\.js|node_modules/,
                failOnError: true,
            }),
            new FixScriptPermissionsPlugin(path.resolve(config.outDir, "scripts")),
        ],
        node: {
            __filename: true,
            __dirname: true,
        },
        module: {
            rules: [{
                    test: /\.(jsx?|tsx?)$/,
                    include: [
                        path.resolve(config.dir, "src"),
                    ],
                    use: [{
                            loader: "ts-loader",
                            options: {
                                configFile: "tsconfig.json",
                                onlyCompileBundledFiles: true
                            },
                        }],
                }],
        },
    };
};
