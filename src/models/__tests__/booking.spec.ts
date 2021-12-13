import { BookingBuilder } from '../entities/booking';
import { ChangeLogAction, User } from '..';
import { BookingStatus } from '../index';
import {OneOffTimeslot} from "../entities";

describe('Booking tests', () => {
	it('should get update change type', () => {
		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(new Date('2020-01-10T11:00'))
			.withEndDateTime(new Date('2020-01-10T12:00'))
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.build();

		const newbooking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(new Date('2020-01-10T11:00'))
			.withEndDateTime(new Date('2020-01-10T12:00'))
			.withLocation('New Location')
			.withDescription('New Description')
			.withServiceId(2)
			.build();

		const changeType = newbooking.getUpdateChangeType(booking);
		expect(changeType).toBe(ChangeLogAction.Update);
	});

	it('should get reschedule change type', () => {
		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(new Date('2020-01-10T11:00'))
			.withEndDateTime(new Date('2020-01-10T12:00'))
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.build();

		const newbooking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(new Date('2020-01-10T11:00'))
			.withEndDateTime(new Date('2020-01-10T14:00'))
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.build();

		const changeType = newbooking.getUpdateChangeType(booking);
		expect(changeType).toBe(ChangeLogAction.Reschedule);
	});

	it('should create accepted booking with builder', () => {
		const start = new Date('2020-01-10T11:00');
		const end = new Date('2020-01-10T12:00');
		const creator = {} as User;

		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.withCreator(creator)
			.withAutoAccept(true)
			.build();

		expect(booking.citizenUinFin).toStrictEqual('UINFIN');
		expect(booking.serviceProviderId).toStrictEqual(1);
		expect(booking.startDateTime).toStrictEqual(start);
		expect(booking.endDateTime).toStrictEqual(end);
		expect(booking.refId).toStrictEqual('REFID');
		expect(booking.location).toStrictEqual('Location');
		expect(booking.description).toStrictEqual('Description');
		expect(booking.serviceId).toStrictEqual(2);
		expect(booking.creator).toStrictEqual(creator);
		expect(booking.status).toStrictEqual(BookingStatus.Accepted);
	});

	it('should create pending approval booking with builder', () => {
		const start = new Date('2020-01-10T11:00');
		const end = new Date('2020-01-10T12:00');
		const creator = {} as User;

		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.withCreator(creator)
			.withAutoAccept(true)
			.build();

		expect(booking.citizenUinFin).toStrictEqual('UINFIN');
		expect(booking.serviceProviderId).toStrictEqual(1);
		expect(booking.startDateTime).toStrictEqual(start);
		expect(booking.endDateTime).toStrictEqual(end);
		expect(booking.refId).toStrictEqual('REFID');
		expect(booking.location).toStrictEqual('Location');
		expect(booking.description).toStrictEqual('Description');
		expect(booking.serviceId).toStrictEqual(2);
		expect(booking.creator).toStrictEqual(creator);
		expect(booking.status).toStrictEqual(BookingStatus.Accepted);
	});

	it('should create pending booking with builder', () => {
		const start = new Date('2020-01-10T11:00');
		const end = new Date('2020-01-10T12:00');
		const creator = {} as User;

		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withRefId('REFID')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.withCreator(creator)
			.withAutoAccept(true)
			.build();

		expect(booking.citizenUinFin).toStrictEqual('UINFIN');
		expect(booking.startDateTime).toStrictEqual(start);
		expect(booking.endDateTime).toStrictEqual(end);
		expect(booking.refId).toStrictEqual('REFID');
		expect(booking.location).toStrictEqual('Location');
		expect(booking.description).toStrictEqual('Description');
		expect(booking.serviceId).toStrictEqual(2);
		expect(booking.creator).toStrictEqual(creator);
		expect(booking.status).toStrictEqual(BookingStatus.PendingApproval);
	});
});

describe('Booking tests with onhold flag', () => {
	it('should create accepted booking with builder when auto-accept is true and onhold is false', () => {
		const start = new Date('2020-01-10T11:00');
		const end = new Date('2020-01-10T12:00');
		const creator = {} as User;

		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.withCreator(creator)
			.withAutoAccept(true)
			.withMarkOnHold(false)
			.build();

		expect(booking.citizenUinFin).toStrictEqual('UINFIN');
		expect(booking.serviceProviderId).toStrictEqual(1);
		expect(booking.startDateTime).toStrictEqual(start);
		expect(booking.endDateTime).toStrictEqual(end);
		expect(booking.refId).toStrictEqual('REFID');
		expect(booking.location).toStrictEqual('Location');
		expect(booking.description).toStrictEqual('Description');
		expect(booking.serviceId).toStrictEqual(2);
		expect(booking.creator).toStrictEqual(creator);
		expect(booking.status).toStrictEqual(BookingStatus.Accepted);
	});

	it('should create pending booking with builder when auto-accept is false and onhold is false', () => {
		const start = new Date('2020-01-10T11:00');
		const end = new Date('2020-01-10T12:00');
		const creator = {} as User;
		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.withCreator(creator)
			.withAutoAccept(false)
			.withMarkOnHold(false)
			.build();

		expect(booking.citizenUinFin).toStrictEqual('UINFIN');
		expect(booking.serviceProviderId).toStrictEqual(1);
		expect(booking.startDateTime).toStrictEqual(start);
		expect(booking.endDateTime).toStrictEqual(end);
		expect(booking.refId).toStrictEqual('REFID');
		expect(booking.location).toStrictEqual('Location');
		expect(booking.description).toStrictEqual('Description');
		expect(booking.serviceId).toStrictEqual(2);
		expect(booking.creator).toStrictEqual(creator);
		expect(booking.status).toStrictEqual(BookingStatus.PendingApproval);
	});

	it('should create on hold booking with builder when auto-accept is true and onhold is true', () => {
		const start = new Date('2020-01-10T11:00');
		const end = new Date('2020-01-10T12:00');
		const creator = {} as User;
		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.withCreator(creator)
			.withAutoAccept(true)
			.withMarkOnHold(true)
			.build();

		expect(booking.citizenUinFin).toStrictEqual('UINFIN');
		expect(booking.serviceProviderId).toStrictEqual(1);
		expect(booking.startDateTime).toStrictEqual(start);
		expect(booking.endDateTime).toStrictEqual(end);
		expect(booking.refId).toStrictEqual('REFID');
		expect(booking.location).toStrictEqual('Location');
		expect(booking.description).toStrictEqual('Description');
		expect(booking.serviceId).toStrictEqual(2);
		expect(booking.creator).toStrictEqual(creator);
		expect(booking.status).toStrictEqual(BookingStatus.OnHold);
	});

	it('should create on hold booking with builder when auto-accept is false and onhold is true', () => {
		const start = new Date('2020-01-10T11:00');
		const end = new Date('2020-01-10T12:00');
		const creator = {} as User;
		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withLocation('Location')
			.withDescription('Description')
			.withServiceId(2)
			.withCreator(creator)
			.withAutoAccept(false)
			.withMarkOnHold(true)
			.build();

		expect(booking.citizenUinFin).toStrictEqual('UINFIN');
		expect(booking.serviceProviderId).toStrictEqual(1);
		expect(booking.startDateTime).toStrictEqual(start);
		expect(booking.endDateTime).toStrictEqual(end);
		expect(booking.refId).toStrictEqual('REFID');
		expect(booking.location).toStrictEqual('Location');
		expect(booking.description).toStrictEqual('Description');
		expect(booking.serviceId).toStrictEqual(2);
		expect(booking.creator).toStrictEqual(creator);
		expect(booking.status).toStrictEqual(BookingStatus.OnHold);
	});

	it('should create event booking with builder and set event id and booked slots', () => {
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2020-01-10T11:00');
		oneOffTimeslots.endDateTime = new Date('2020-01-10T12:00');
		const creator = {} as User;
		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withEventId(1)
			.withSlots([oneOffTimeslots])
			.withServiceId(2)
			.withCreator(creator)
			.build();

		expect(booking.eventId).toStrictEqual(1);
		expect(booking.bookedSlots[0].oneOffTimeslot).toStrictEqual(oneOffTimeslots);
		expect(booking.status).toStrictEqual(BookingStatus.Accepted);
	});

	it('should create event booking with builder and set status at accepted irrespective of autoAccept flag', () => {
		const creator = {} as User;
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2020-01-10T11:00');
		oneOffTimeslots.endDateTime = new Date('2020-01-10T12:00');
		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withEventId(1)
			.withSlots([oneOffTimeslots])
			.withServiceId(2)
			.withCreator(creator)
			.withAutoAccept(false)
			.build();

		expect(booking.status).toStrictEqual(BookingStatus.Accepted);
	});

	it('should create event booking with builder and set status as on hold id OnHold flag is set', () => {
		const creator = {} as User;
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2020-01-10T11:00');
		oneOffTimeslots.endDateTime = new Date('2020-01-10T12:00');
		const booking = new BookingBuilder()
			.withCitizenUinFin('UINFIN')
			.withServiceProviderId(1)
			.withRefId('REFID')
			.withEventId(1)
			.withSlots([oneOffTimeslots])
			.withServiceId(2)
			.withCreator(creator)
			.withAutoAccept(false)
			.withMarkOnHold(true)
			.build();

		expect(booking.status).toStrictEqual(BookingStatus.OnHold);
	});
});
