import { Container } from "typescript-ioc";
import { UsersController } from "../users.controller";
import * as Koa from "koa";

describe("Users Controller", () => {
	it("should get profile", async () => {
		const controller = Container.get(UsersController);

		(controller as any).context = {
			request: {
				header: {
					authlevel: 2
				}
			}
		};

		const profile = controller.getProfile('ABC1234');
		expect(profile).toBeDefined();
	});
});
