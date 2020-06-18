import { KoaHealth } from "mol-lib-common";
import { basePath } from '../config/app-config';

const healthPath = (() => {
	const path = `${basePath}/health`;
	return path.startsWith('/') ? path.substring(1, path.length)
		: path;
})();

// STUB
const checkMyMolService = async () => {
	await Promise.resolve("my new mol service is connected");
};

// STUB
export const HealthCheckMiddleware = new KoaHealth(healthPath, {
	mol_service: checkMyMolService,
});
