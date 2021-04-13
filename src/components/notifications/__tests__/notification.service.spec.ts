import { Container } from 'typescript-ioc';
import { NotificationsService } from '../notifications.service';
import { CreateEmail } from 'mol-lib-api-contract/notification/mail';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract/error';
import { mailer } from '../../../config/mailer';

jest.mock('../../../config/app-config', () => {
	const configMock = {
		isLocal: true,
		molNotification: { url: '' },
		mailer: {
			smtpHost: 'email-smtp.us-east-1.amazonaws.com',
			smtpPort: '',
			smtpSecure: '',
			smtpUseAuth: '',
			smtpAuthUsername: '',
			smtpAuthPassword: '',
		},

		email: {
			mol: {
				sender: '',
			},
		},
	};

	return {
		getConfig: () => configMock,
	};
});

describe('Send email', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		mailer.sendMail = jest.fn(() => ({
			accepted: ['success@foo.com'],
			rejected: ['reject@foo.com'],
			messageId: 'messageId',
		}));
	});
	it('should send mail to single recipient', async () => {
		const options: CreateEmail.Domain.CreateEmailRequestApiDomain = {
			from: 'from@foo.com',
			to: ['to@foo.com'],
			subject: 'Single recipient',
			html: '<h1>Single recipient</h1>',
		};
		const expectedOptions = {
			...options,
			to: options.to.join(','),
		};
		const instance = await Container.get(NotificationsService);
		await instance.sendEmail(options);
		expect(mailer.sendMail).toHaveBeenCalledWith(expectedOptions);
	});

	it('should throw error when email is invalid', async () => {
		const options: CreateEmail.Domain.CreateEmailRequestApiDomain = {
			to: ['INVALID EMAIL'],
			subject: 'Single recipient',
			html: '<h1>Single recipient</h1>',
		};

		const invalidEmailError = new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setMessage('Invalid email address');
		const instance = await Container.get(NotificationsService);
		await expect(instance.sendEmail(options)).rejects.toEqual(invalidEmailError);
	});

	it('should send mail to multiple recipients', async () => {
		const options: CreateEmail.Domain.CreateEmailRequestApiDomain = {
			from: 'from@foo.com',
			to: ['to@foo.com', 'anotherto@foo.com'],
			subject: 'Multiple recipients',
			html: '<h1>Multiple recipients</h1>',
		};
		const expectedOptions = {
			...options,
			to: options.to.join(','),
		};
		const instance = await Container.get(NotificationsService);
		await instance.sendEmail(options);
		expect(mailer.sendMail).toHaveBeenCalledWith(expectedOptions);
	});

	it('should throw error when any email is invalid', async () => {
		const options: CreateEmail.Domain.CreateEmailRequestApiDomain = {
			to: ['INVALID EMAIL', 'valid@email.com'],
			subject: 'Single recipient',
			html: '<h1>Single recipient</h1>',
		};

		const invalidEmailError = new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setMessage('Invalid email address');
		const instance = await Container.get(NotificationsService);
		await expect(instance.sendEmail(options)).rejects.toEqual(invalidEmailError);
	});

	it('should create citizen email for citizen created booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createCitizenEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 1,
				_location: 'Some street',
			},
			_bookingType: 'Created',
			_userType: { _singPassUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
Your booking request has been received.
<br />
Booking for: <b>Career.</b>
<br />
Below is a confirmation of your booking details.
Booking status: <b>Pending Approval</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG confirmation: Career',
		});
	});

	it('should create citizen email for citizen updated booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createCitizenEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 1,
				_location: 'Some street',
			},
			_bookingType: 'Updated',
			_userType: { _singPassUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
You have updated a booking.
<br />
Booking for: <b>Career.</b>
<br />
Below is a confirmation of your updated booking details.
Booking status: <b>Pending Approval</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG update: Career',
		});
	});

	it('should create citizen email for citizen cancelled booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createCitizenEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 3,
				_location: 'Some street',
			},
			_bookingType: 'CancelledOrRejected',
			_userType: { _singPassUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
You have cancelled the following booking.
<br />
Booking for: <b>Career.</b>
<br />
Booking status: <b>Cancelled</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG cancellation: Career',
		});
	});

	it('should create citizen email for service provider created booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createCitizenEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 1,
				_location: 'Some street',
			},
			_bookingType: 'Created',
			_userType: { _adminUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
A booking has been made.
<br />
Booking for: <b>Career.</b>
<br />
Below is a confirmation of your booking details.
Booking status: <b>Pending Approval</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG confirmation: Career',
		});
	});

	it('should create citizen email for service provider updated booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createCitizenEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 1,
				_location: 'Some street',
			},
			_bookingType: 'Updated',
			_userType: { _adminUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
There has been an update to your booking confirmation.
<br />
Booking for: <b>Career.</b>
<br />
Below is a confirmation of your updated booking details.
Booking status: <b>Pending Approval</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG update: Career',
		});
	});

	it('should create citizen email for service provider cancelled booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createCitizenEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 3,
				_location: 'Some street',
			},
			_bookingType: 'CancelledOrRejected',
			_userType: { _adminUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
The following booking has been cancelled by the other party.
<br />
Booking for: <b>Career.</b>
<br />
Booking status: <b>Cancelled</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG cancellation: Career',
		});
	});

	it('should create service provider email for citizen created booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createServiceProviderEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 1,
				_location: 'Some street',
				_serviceProviderId: 1,
				_serviceProvider: {}
			},
			_bookingType: 'Created',
			_userType: { _singPassUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
You have received a new booking request.
<br />
Booking for: <b>Career.</b>
<br />
Below is a summary of the booking request details.
<br/>
Booking status: <b>Pending Approval</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG request: Career',
		});
	});

	it('should create service provider email for citizen updated booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createServiceProviderEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 1,
				_location: 'Some street',
				_serviceProviderId: 1,
				_serviceProvider: {}
			},
			_bookingType: 'Updated',
			_userType: { _singPassUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
There has been an update to the following booking by the other party.
<br />
Booking for: <b>Career.</b>
<br />
Below is a confirmation of the updated booking details.
<br/>
Booking status: <b>Pending Approval</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG update: Career',
		});
	});

	it('should create service provider email for citizen cancelled booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createServiceProviderEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 1,
				_location: 'Some street',
				_serviceProviderId: 1,
				_serviceProvider: {}
			},
			_bookingType: 'CancelledOrRejected',
			_userType: { _singPassUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
The following booking has been cancelled by the other party.
<br />
Booking for: <b>Career.</b>
<br />
Booking status: <b>Pending Approval</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG cancellation: Career',
		});
	});

	it('should create service provider email for service provider updated booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createServiceProviderEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 2,
				_location: 'Some street',
				_serviceProviderId: 1,
				_serviceProvider: {}
			},
			_bookingType: 'Updated',
			_userType: { _adminUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
You have updated a booking.
<br />
Booking for: <b>Career.</b>
<br />
Below is a summary of your updated booking details.
<br/>
Booking status: <b>Accepted</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG update: Career',
		});
	});

	it('should create service provider email for service provider cancelled booking', async () => {
		const instance = await Container.get(NotificationsService);
		const template = instance.createServiceProviderEmailFactory({
			_booking: {
				_startDateTime: new Date('2021-04-14T02:00:00.000Z'),
				_endDateTime: new Date('2021-04-14T03:00:00.000Z'),
				_service: { _name: 'Career' },
				_status: 3,
				_location: 'Some street',
				_serviceProviderId: 1,
				_serviceProvider: {}
			},
			_bookingType: 'CancelledOrRejected',
			_userType: { _adminUser: {} },
		});
		expect(template).toEqual({
			html: `<pre>
You have cancelled the following booking.
<br />
Booking for: <b>Career.</b>
<br />
Booking status: <b>Cancelled</b>
Date: <b>14 April 2021</b>
Time: <b>12:00pm - 1:00pm</b>
Location: <b>Some street</b>
</pre>`,
			subject: 'BookingSG cancellation: Career',
		});
	});
});

