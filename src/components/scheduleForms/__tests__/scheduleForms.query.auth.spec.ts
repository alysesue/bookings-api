import { Organisation, Service, ServiceProvider, User } from '../../../models';
import { CrudAction } from '../../../enums/crudAction';
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { ScheduleFormsActionAuthVisitor, ScheduleFormsQueryAuthVisitor } from '../scheduleForms.auth';
import { ServiceProvidersActionAuthVisitor } from '../../serviceProviders/serviceProviders.auth';

// tslint:disable-next-line:no-big-function
describe('Query scheduleForm Auth', () => {
	it('should test query condition for serviceProvider', async () => {
		const serviceProvider = ServiceProvider.create('provider', 1);
		serviceProvider.service = new Service();
		const userGroup = new ServiceProviderAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			serviceProvider,
		);

		const { userCondition } = await new ScheduleFormsQueryAuthVisitor(
			'service',
			'serviceProvider',
		).createUserVisibilityCondition([userGroup]);

		expect(userCondition).toBe('(serviceProvider._id = :serviceProviderId)');
	});

	it('should test query condition for service admin', async () => {
		const service = new Service();
		service.id = 1;
		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.service = service;

		const { userCondition } = await new ScheduleFormsQueryAuthVisitor(
			'service',
			'serviceProvider',
		).createUserVisibilityCondition([userGroup]);

		expect(userCondition).toBe('(service._id IN (:...serviceIds))');
	});

	it('should test query condition for org admin', async () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[organisation],
		);
		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.service = new Service();
		serviceProvider.service.organisationId = 1;

		const { userCondition } = await new ScheduleFormsQueryAuthVisitor(
			'service',
			'serviceProvider',
		).createUserVisibilityCondition([userGroup]);

		expect(userCondition).toBe('(service._organisationId IN (:...orgIds))');
	});

	it('should  test query condition entity citizen', async () => {
		const userGroup = new CitizenAuthGroup(User.createSingPassUser('23', '23'));
		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.service = new Service();

		const { userCondition } = await new ScheduleFormsQueryAuthVisitor(
			'service',
			'serviceProvider',
		).createUserVisibilityCondition([userGroup]);

		expect(userCondition).toBe('FALSE');
	});
});
