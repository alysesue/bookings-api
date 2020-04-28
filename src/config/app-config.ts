import { ConfigUtils } from "mol-lib-common/utils/config/ConfigUtils";

const packageJSON = require("../../package.json");
require("dotenv").config();

export const config = {
	name: packageJSON.name,
	version: packageJSON.version,
	port: ConfigUtils.getIntValueFromEnv("PORT", 3000),
	env: ConfigUtils.getValueFromEnv("NODE_ENV", "production"),
};
