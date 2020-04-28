import { Config, createBaseServiceConfig } from "mol-lib-config/shared-config/service.node12.webpack.config";

const config: Config = {
	name: "bookingsg-api",
	dir: "./",
};
const webPackConfig = createBaseServiceConfig(config);

export default webPackConfig;
