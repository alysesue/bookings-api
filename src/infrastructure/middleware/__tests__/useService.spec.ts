import { useService } from "../useService";
import { Container } from "typescript-ioc";

describe('useService', () => {
	it('should set service to container', async () => {
		const service = 'coaches';
		const context = {
			params: {
				service
			}
		};
		await useService(context, jest.fn());

		expect(Container.getValue('config.serviceName')).toBe(service);
	});
});
