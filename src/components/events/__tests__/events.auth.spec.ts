import { Organisation, Service, User } from '../../../models';
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { Event } from '../../../models/entities/event';
import { EventsAuthVisitor } from '../events.auth';

describe('Event action auth', () => {
	const organisation = new Organisation();
	organisation.id = 2;

	const getEventMock = () => {
		const eventMock = new Event();
		eventMock.id = 20;

		const serviceMock = new Service();
		serviceMock.id = 30;
		serviceMock.organisation = organisation;
		serviceMock.organisationId = organisation.id;

		eventMock.service = serviceMock;
		eventMock.serviceId = serviceMock.id;

		return { eventMock, serviceMock };
	};
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should reject if Citizen', async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];
		const eventMock = new Event();
		expect(() => new EventsAuthVisitor(eventMock).hasPermission(groups)).toThrow();
	});

	it('should return true if orga-admin but same organisation', async () => {
		const { eventMock } = getEventMock();
		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisation])];
		const res = new EventsAuthVisitor(eventMock).hasPermission(groups);
		expect(res).toBe(true);
	});

	it('should return false if orga-admin but different organisation', async () => {
		const { eventMock } = getEventMock();
		const orga = new Organisation();
		orga.id = 1;
		const groups = [new OrganisationAdminAuthGroup(adminMock, [orga])];
		const res = new EventsAuthVisitor(eventMock).hasPermission(groups);
		expect(res).toBe(false);
	});

	it('should return true if service-admin', async () => {
		const { eventMock, serviceMock } = getEventMock();
		const groups = [new ServiceAdminAuthGroup(adminMock, [serviceMock])];
		const res = new EventsAuthVisitor(eventMock).hasPermission(groups);
		expect(res).toBe(true);
	});

	it('should return false if service-admin but different service', async () => {
		const { eventMock } = getEventMock();
		const service = new Service();
		service.id = 1;
		const groups = [new ServiceAdminAuthGroup(adminMock, [service])];
		const res = new EventsAuthVisitor(eventMock).hasPermission(groups);
		expect(res).toBe(false);
	});
});
