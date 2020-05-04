import { CleanWebpackPlugin } from "clean-webpack-plugin";
import * as webpack from "webpack";
export interface Config {
    name: string;
    dir: string;
    outDir?: string;
    cleanPlugin?: CleanWebpackPlugin;
}
export declare const createBaseConfig: (config: Config) => webpack.Configuration;
//# sourceMappingURL=base.webpack.config.d.ts.map