import { Organisation, Service, ServiceProvider, User } from '../../../models';
import { NotificationTemplateQueryAuthVisitor } from '../serviceNotificationTemplate.auth';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import * as uuid from 'uuid';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe('Services Notification Template auth tests - query', () => {
	const organisation = new Organisation();
	organisation.id = 2;

	const service = new Service();
	service.id = 3;
	service.name = 'service';
	service.organisationId = organisation.id;
	service.organisation = organisation;

	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should return FALSE query when user has no groups', async () => {
		const result = await new NotificationTemplateQueryAuthVisitor(
			'service_notification_template',
			'service',
		).createUserVisibilityCondition([]);

		expect(result.userCondition).toStrictEqual('FALSE');
		expect(result.userParams).toStrictEqual({});
	});

	it(`should return FALSE query for anonymous user`, async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];
		const result = await new NotificationTemplateQueryAuthVisitor(
			'service_notification_template',
			'service',
		).createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('FALSE');
		expect(result.userParams).toStrictEqual({});
	});

	it(`should return FALSE query for citizen`, async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];
		const result = await new NotificationTemplateQueryAuthVisitor(
			'service_notification_template',
			'service',
		).createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('FALSE');
		expect(result.userParams).toStrictEqual({});
	});

	it(`should filter by organisation id`, async () => {
		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisation])];
		const result = await new NotificationTemplateQueryAuthVisitor(
			'service_notification_template',
			'service',
		).createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(service."_organisationId" IN (:...authorisedOrganisationIds))');
		expect(result.userParams).toStrictEqual({
			authorisedOrganisationIds: [2],
		});
	});

	it(`should filter by service id`, async () => {
		const groups = [new ServiceAdminAuthGroup(adminMock, [service])];
		const result = await new NotificationTemplateQueryAuthVisitor(
			'service_notification_template',
			'service',
		).createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual(
			'(service_notification_template._serviceId IN (:...authorisedServiceIds))',
		);
		expect(result.userParams).toStrictEqual({
			authorisedServiceIds: [3],
		});
	});

	it(`should filter by service related to service provider`, async () => {
		const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvider.id = 5;
		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];
		const result = await new NotificationTemplateQueryAuthVisitor(
			'service_notification_template',
			'service',
		).createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(service_notification_template._serviceId = :serviceProviderServiceId)');
		expect(result.userParams).toStrictEqual({
			serviceProviderServiceId: 3,
		});
	});

	it(`should combine user groups' permission (union)`, async () => {
		const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvider.id = 5;
		const groups = [
			new OrganisationAdminAuthGroup(adminMock, [organisation]),
			new ServiceAdminAuthGroup(adminMock, [service]),
		];
		const result = await new NotificationTemplateQueryAuthVisitor(
			'service_notification_template',
			'service',
		).createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual(
			'((service."_organisationId" IN (:...authorisedOrganisationIds)) OR (service_notification_template._serviceId IN (:...authorisedServiceIds)))',
		);
		expect(result.userParams).toStrictEqual({
			authorisedOrganisationIds: [2],
			authorisedServiceIds: [3],
		});
	});
});
