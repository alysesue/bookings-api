// import { ServiceNotificationTemplate } from '../../../models';
// import { Container } from 'typescript-ioc';
// import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate.repository';
// import { TransactionManager } from '../../../core/transactionManager';
// import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
// import { UserContext } from '../../../infrastructure/auth/userContext';
// import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
//
// describe('Test the service notification template repository', () => {
// 	beforeAll(() => {
// 		jest.resetAllMocks();
// 		Container.bind(TransactionManager).to(TransactionManagerMock);
// 		Container.bind(UserContext).to(UserContextMock);
// 	});
//
// 	beforeEach(() => {
// 		jest.resetAllMocks();
// 		UserContextMock.getAuthGroups.mockReturnValue(Promise.resolve([]));
// 	});
//
// 	const template = new ServiceNotificationTemplate();
// 	template.emailTemplateType = 2;
// 	template.htmlTemplate = 'testings notification template';
// 	template.serviceId = 1;
//
// 	const expectedTemplate = new ServiceNotificationTemplate();
// 	expectedTemplate.emailTemplateType = 2;
// 	expectedTemplate.htmlTemplate = 'testings notification template';
// 	expectedTemplate.serviceId = 1;
// 	expectedTemplate.id = 1;
//
// 	it('should save an email notification template', async () => {
// 		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(expectedTemplate));
// 		const repository = Container.get(ServiceNotificationTemplateRepository);
// 		const result = await repository.save(template);
// 		expect(result).toEqual(expectedTemplate);
// 	});
//
// 	it('should get an email notification template', async () => {
// 		const queryMock: {
// 			where: jest.Mock;
// 			leftJoin: jest.Mock;
// 			leftJoinAndSelect: jest.Mock;
// 			getOne: jest.Mock<Promise<ServiceNotificationTemplate>, any>;
// 		} = {
// 			where: jest.fn(),
// 			leftJoin: jest.fn(),
// 			leftJoinAndSelect: jest.fn(),
// 			getOne: jest.fn<Promise<ServiceNotificationTemplate>, any>(),
// 		};
//
// 		queryMock.getOne.mockImplementation(() => Promise.resolve(template));
//
// 		const repository = Container.get(ServiceNotificationTemplateRepository);
// 		const result = await repository.getTemplate(1, 2);
// 		console.log('result', result);
// 		// expect(result).toBeDefined();
// 		// expect(queryMock.getOne).toBeCalled();
// 	});
// });
