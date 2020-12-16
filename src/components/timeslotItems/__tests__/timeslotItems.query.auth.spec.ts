import { TimeslotItemsQueryAuthVisitor } from '../timeslotItems.auth';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { Organisation, Service, ServiceProvider } from '../../../models/entities';
import { User } from '../../../models';
import * as uuid from 'uuid';

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
		const userGroup = await new TimeslotItemsQueryAuthVisitor(
			'service alias',
			'service provider alias',
			'service provider service alias',
		).createUserVisibilityCondition([]);

		expect(userGroup.userCondition).toStrictEqual('FALSE');
		expect(userGroup.userParams).toStrictEqual({});
	});

	it('should filter by organisation ID', async () => {
		const userGroup = new OrganisationAdminAuthGroup(adminUser, [organisation]);
		const visitor = await new TimeslotItemsQueryAuthVisitor(
			'service alias',
			'service provider alias',
			'service provider service alias',
		).createUserVisibilityCondition([userGroup]);

		expect(visitor.userCondition).toStrictEqual(
			'(service alias._organisationId IN (:...orgIds) OR service provider service alias._organisationId IN (:...orgIds))',
		);
		expect(visitor.userParams).toStrictEqual({ orgIds: [1] });
	});

	it('should filter by service ID', async () => {
		const userGroup = new ServiceAdminAuthGroup(adminUser, [service]);

		const visitor = await new TimeslotItemsQueryAuthVisitor(
			'service alias',
			'service provider alias',
			'service provider service alias',
		).createUserVisibilityCondition([userGroup]);

		expect(visitor.userCondition).toStrictEqual(
			'(service provider alias._id IN (:...serviceIds) OR service provider service alias._id IN (:...serviceIds))',
		);
		expect(visitor.userParams).toStrictEqual({ serviceIds: [2] });
	});

	it('should filter by service provider ID', async () => {
		const userGroup = new ServiceProviderAuthGroup(adminUser, serviceProvider);

		const visitor = await new TimeslotItemsQueryAuthVisitor(
			'service alias',
			'service provider alias',
			'service provider service alias',
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
		const visitor = await new TimeslotItemsQueryAuthVisitor(
			'service alias',
			'service provider alias',
			'service provider service alias',
		).createUserVisibilityCondition(userGroup);

		expect(visitor.userCondition).toStrictEqual(
			'((service provider alias._id IN (:...serviceIds) OR service provider service alias._id IN (:...serviceIds)) OR (service alias._id = :serviceId OR service provider alias._id = :serviceProviderId))',
		);
		expect(visitor.userParams).toStrictEqual({
			serviceId: 1,
			serviceIds: [2],
			serviceProviderId: 10,
		});
	});

	it('should not query any data as anonymous user', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];

		const visitor = await new TimeslotItemsQueryAuthVisitor(
			'service alias',
			'service provider alias',
			'service provider service alias',
		).createUserVisibilityCondition(groups);

		expect(visitor.userParams).toStrictEqual({});
		expect(visitor.userCondition).toStrictEqual('FALSE');
	});

	it('should not query any data as a citizen', async () => {
		const userGroup = new CitizenAuthGroup(singPassUser);

		const visitor = await new TimeslotItemsQueryAuthVisitor(
			'service alias',
			'service provider alias',
			'service provider service alias',
		).createUserVisibilityCondition([userGroup]);

		expect(visitor.userParams).toStrictEqual({});
		expect(visitor.userCondition).toStrictEqual('FALSE');
	});
});
