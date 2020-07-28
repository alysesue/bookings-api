import { ConfigUtils } from "mol-lib-common/utils/config/ConfigUtils";

const packageJSON = require("../../package.json");
require("dotenv").config();

export const getConfig = () => ({
	name: packageJSON.name,
	version: packageJSON.version,
	port: ConfigUtils.getIntValueFromEnv("PORT", 3000),
	isDev: Boolean(ConfigUtils.getValueFromEnv("IS_DEV", 'false')),
	env: ConfigUtils.getValueFromEnv("NODE_ENV", "production"),
	serviceAccount: ConfigUtils.getValueFromEnv("GOOGLE_SERVICE_ACCOUNT"),
	database: {
		host: ConfigUtils.getValueFromEnv("BOOKINGSG_DB_HOST"),
		port: ConfigUtils.getValueFromEnv("BOOKINGSG_DB_PORT"),
		instance: ConfigUtils.getValueFromEnv("BOOKINGSG_DB_INSTANCE"),
		username: ConfigUtils.getValueFromEnv("BOOKINGSG_DB_USERNAME"),
		password: ConfigUtils.getValueFromEnv("DB_PASSWORD_BOOKINGSG_APP"),
	}
});

export const basePath = '/bookingsg';
