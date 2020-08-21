import { Container } from "typescript-ioc";
import { UsersController } from "../users.controller";
import { MOLSecurityHeaderKeys } from "mol-lib-api-contract/auth/common/mol-security-headers";
import { MOLAuthType } from "mol-lib-api-contract/auth/common/MOLAuthType";

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe("Users Controller", () => {
	it("should get user profile", async () => {
		const controller = Container.get(UsersController);

		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.USER;
		headers[MOLSecurityHeaderKeys.USER_AUTH_LEVEL] = 2;
		headers[MOLSecurityHeaderKeys.USER_ID] = 'abc';

		(controller as any).context = { headers };

		const profile = await controller.getProfile();
		expect(profile).toBeDefined();
	});

	it("should get admin profile", async () => {
		const controller = Container.get(UsersController);

		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
		headers[MOLSecurityHeaderKeys.ADMIN_ID] = '15234fe9c96d41639fb3311dd7a2925b';

		(controller as any).context = { headers };

		const profile = await controller.getProfile();
		expect(profile).toBeDefined();
	});

	it("should not get profile", async () => {
		const controller = Container.get(UsersController);

		const headers = {};
		(controller as any).context = { headers };

		const test = async () => await controller.getProfile();
		await expect(test).rejects.toThrowError();
	});
});
