import { useServiceValidation } from "../useServiceValidator";
import { ServicesValidation } from "../../../services/services.validation";
import { Container } from "typescript-ioc";

describe('Service validator middleware', () => {
	it('should validate service and return 400 if not exists', async () => {
		servicesValidationMock.mockImplementationOnce(() => {
			throw new Error()
		});
		Container.bind(ServicesValidation).to(ServicesValidationMockClass);

		const context = {
			path: 'api/v1/calendars',
			status: 0
		};
		const next = jest.fn();
		await useServiceValidation(context, next);

		expect(context.status).toBe(400)
	});
});

const servicesValidationMock = jest.fn();

class ServicesValidationMockClass extends ServicesValidation {
	async validate(): Promise<void> {
		return servicesValidationMock();
	}
}
