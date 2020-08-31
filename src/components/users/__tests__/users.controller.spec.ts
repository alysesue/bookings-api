import { Container } from "typescript-ioc";
import { UsersController } from "../users.controller";
import { MOLSecurityHeaderKeys } from "mol-lib-api-contract/auth/common/mol-security-headers";
import { MOLAuthType } from "mol-lib-api-contract/auth/common/MOLAuthType";

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe("users controller", () => {
	it("should get user profile", async () => {
		const controller = Container.get(UsersController);
		const headers = {
			[MOLSecurityHeaderKeys.AUTH_TYPE]: MOLAuthType.USER,
			[MOLSecurityHeaderKeys.USER_AUTH_LEVEL]: 2,
			[MOLSecurityHeaderKeys.USER_ID]: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		};
		(controller as any).context = {};
		(controller as any).context = { headers };
		(controller as any).context.request = {};

		const profile = await controller.getProfile();
		expect(profile).toBeDefined();
	});

	it("should get admin profile", async () => {
		const controller = Container.get(UsersController);

		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
		headers[MOLSecurityHeaderKeys.ADMIN_ID] = 'df9e8028-f308-4fb7-a9d8-d8af00455981';

		(controller as any).context = {};
		(controller as any).context = { headers };
		(controller as any).context.request = {};

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
