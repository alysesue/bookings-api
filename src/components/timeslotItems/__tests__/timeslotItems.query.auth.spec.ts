import { TimeslotItemsAuthQueryVisitor } from '../timeslotItems.auth';
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { Organisation, Service, ServiceProvider } from '../../../models/entities';
import { User } from '../../../models';

const adminUser = User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' });

const singPassUser = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

const organisation = new Organisation();
organisation.id = 1;

const service = new Service();
service.id = 2;

const serviceProvider = ServiceProvider.create('John', 1);
serviceProvider.id = 10;

describe('Timeslot items query auth tests', () => {
	it('should return FALSE when user has no groups', async () => {
		const user = await new TimeslotItemsAuthQueryVisitor(
			'service alias',
			'service provider alias',
		).createUserVisibilityCondition([]);

		expect(user.userCondition).toStrictEqual('FALSE');
		expect(user.userParams).toStrictEqual({});
	});

	it('should filter by organisation ID', async () => {
		const userGroup = new OrganisationAdminAuthGroup(adminUser, [organisation]);
		const visitor = await new TimeslotItemsAuthQueryVisitor(
			'service alias',
			'service provider alias',
		).createUserVisibilityCondition([userGroup]);

		expect(visitor.userCondition).toStrictEqual('(service alias._organisationId IN (:...orgIds))');
		expect(visitor.userParams).toStrictEqual({ orgIds: [1] });
	});

	it('should filter by service ID', async () => {
		const userGroup = new ServiceAdminAuthGroup(adminUser, [service]);

		const visitor = await new TimeslotItemsAuthQueryVisitor(
			'service alias',
			'service provider alias',
		).createUserVisibilityCondition([userGroup]);

		expect(visitor.userCondition).toStrictEqual('(service provider alias._id IN (:...serviceIds))');
		expect(visitor.userParams).toStrictEqual({ serviceIds: [2] });
	});

	it('should filter by service provider ID', async () => {
		const userGroup = new ServiceProviderAuthGroup(adminUser, serviceProvider);

		const visitor = await new TimeslotItemsAuthQueryVisitor(
			'service alias',
			'service provider alias',
		).createUserVisibilityCondition([userGroup]);

		expect(visitor.userCondition).toStrictEqual(
			'(service alias._id = :serviceId OR service provider alias._id = :serviceProviderId)',
		);
		expect(visitor.userParams).toStrictEqual({
			serviceId: 1,
			serviceProviderId: 10,
		});
	});

	it('should combine user groups permissions (union)', async () => {
		const userGroup = [
			new ServiceAdminAuthGroup(adminUser, [service]),
			new ServiceProviderAuthGroup(adminUser, serviceProvider),
		];
		const visitor = await new TimeslotItemsAuthQueryVisitor(
			'service alias',
			'service provider alias',
		).createUserVisibilityCondition(userGroup);

		expect(visitor.userCondition).toStrictEqual(
			'((service provider alias._id IN (:...serviceIds)) OR (service alias._id = :serviceId OR service provider alias._id = :serviceProviderId))',
		);
		expect(visitor.userParams).toStrictEqual({
			serviceId: 1,
			serviceIds: [2],
			serviceProviderId: 10,
		});
	});

	it('should not query by auth filter for citizen', async () => {
		const userGroup = new CitizenAuthGroup(singPassUser);

		const visitor = await new TimeslotItemsAuthQueryVisitor(
			'service alias',
			'service provider alias',
		).createUserVisibilityCondition([userGroup]);

		expect(visitor.userParams).toStrictEqual({});
		expect(visitor.userCondition).toStrictEqual('FALSE');
	});
});
