import { Booking, BookingBuilder } from '../entities/booking';
import { ChangeLogAction, User } from '..';
import { BookingStatus } from '../index';

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
