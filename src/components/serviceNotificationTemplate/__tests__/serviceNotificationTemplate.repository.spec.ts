import { ServiceNotificationTemplate } from '../../../models';
import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate.repository';
import { TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';

describe('Services Notification Template repository test', () => {
	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(TransactionManager).to(TransactionManagerMock);
		Container.bind(UserContext).to(UserContextMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		UserContextMock.getAuthGroups.mockReturnValue(Promise.resolve([]));
	});

	const template = new ServiceNotificationTemplate();
	template.emailTemplateType = 2;
	template.htmlTemplate = 'testings notification template';

	const expectedTemplate = new ServiceNotificationTemplate();
	expectedTemplate.emailTemplateType = 2;
	expectedTemplate.htmlTemplate = 'testings notification template';
	expectedTemplate.id = 1;

	it('should save an email notification template', async () => {
		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(expectedTemplate));
		const repository = Container.get(ServiceNotificationTemplateRepository);
		const result = await repository.save(template);
		expect(result).toEqual(expectedTemplate);
	});

	it('should get an email notification template', async () => {
		const queryBuilderMock: {
			where: jest.Mock;
			getOne: jest.Mock<Promise<ServiceNotificationTemplate>, any>;
		} = {
			where: jest.fn(),
			getOne: jest.fn<Promise<ServiceNotificationTemplate>, any>(),
		};
		queryBuilderMock.where.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(template));
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(ServiceNotificationTemplateRepository);
		const result = await repository.getEmailServiceNotificationTemplateByType(1, 2);
		expect(queryBuilderMock.getOne).toBeCalled();
		expect(result).toBeDefined();
		expect(result.htmlTemplate).toEqual('testings notification template');
	});
});
