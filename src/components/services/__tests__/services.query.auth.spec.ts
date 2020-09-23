import { Calendar, Organisation, Service, ServiceProvider, User } from '../../../models';
import { OrganisationQueryAuthVisitor } from '../organisations.auth';
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe('Organisations query auth', () => {
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
		const result = await new OrganisationQueryAuthVisitor('o').createUserVisibilityCondition([]);

		expect(result.userCondition).toStrictEqual('FALSE');
		expect(result.userParams).toStrictEqual({});
	});

	it(`should return no filter for citizen (all organisations visible)`, async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];
		const result = await new OrganisationQueryAuthVisitor('o').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('');
		expect(result.userParams).toStrictEqual({});
	});

	it(`should filter by organisation id`, async () => {
		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisation])];
		const result = await new OrganisationQueryAuthVisitor('o').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(o._id IN (:...authorisedOrganisationIds))');
		expect(result.userParams).toStrictEqual({
			authorisedOrganisationIds: [2],
		});
	});

	it(`should filter by service id`, async () => {
		const groups = [new ServiceAdminAuthGroup(adminMock, [service])];
		const result = await new OrganisationQueryAuthVisitor('o').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual(
			'(EXISTS (SELECT 1 FROM public.service as svc where svc."_organisationId" = o._id and svc._id IN (:...authorisedServiceIds)))',
		);
		expect(result.userParams).toStrictEqual({
			authorisedServiceIds: [3],
		});
	});

	it(`should filter by service related to service provider`, async () => {
		const serviceProvider = ServiceProvider.create('Peter', new Calendar(), service.id, 'test@email.com', '0000');
		serviceProvider.id = 5;
		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];
		const result = await new OrganisationQueryAuthVisitor('o').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual(
			'(EXISTS (SELECT 1 FROM public.service as svc where svc."_organisationId" = o._id and svc._id IN (:...authorisedServiceIds)))',
		);
		expect(result.userParams).toStrictEqual({
			authorisedServiceIds: [3],
		});
	});

	it(`should combine user groups' permission (union)`, async () => {
		const serviceProvider = ServiceProvider.create('Peter', new Calendar(), service.id, 'test@email.com', '0000');
		serviceProvider.id = 5;
		const groups = [
			new OrganisationAdminAuthGroup(adminMock, [organisation]),
			new ServiceAdminAuthGroup(adminMock, [service]),
		];
		const result = await new OrganisationQueryAuthVisitor('o').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual(
			'((o._id IN (:...authorisedOrganisationIds)) OR (EXISTS (SELECT 1 FROM public.service as svc where svc."_organisationId" = o._id and svc._id IN (:...authorisedServiceIds))))',
		);
		expect(result.userParams).toStrictEqual({
			authorisedOrganisationIds: [2],
			authorisedServiceIds: [3],
		});
	});
});
