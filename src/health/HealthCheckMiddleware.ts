import { KoaHealth } from "mol-lib-common";

// STUB
const checkMyMolService = async () => {
	await Promise.resolve("my new mol service is connected");
};

// STUB
export const HealthCheckMiddleware = new KoaHealth("bookingsg-api/health", {
	mol_service: checkMyMolService,
});
