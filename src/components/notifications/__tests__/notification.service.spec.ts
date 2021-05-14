import { Container } from 'typescript-ioc';
import { NotificationsService } from '../notifications.service';
import { CreateEmail } from 'mol-lib-api-contract/notification/mail';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract/error';
import { mailer } from '../../../config/mailer';

jest.mock('../../../config/mailer');

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

// tslint:disable-next-line:no-big-function
describe('Send email', () => {
	const mailerMock = {
		sendMail: jest.fn()
	};

	beforeEach(() => {
		jest.resetAllMocks();
		mailerMock.sendMail.mockImplementation(() => Promise.resolve({
			accepted: ['success@foo.com'],
			rejected: ['reject@foo.com'],
			messageId: 'messageId',
		}));

		(mailer as jest.Mock).mockImplementation(() => Promise.resolve(mailerMock));
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
		expect(mailerMock.sendMail).toHaveBeenCalledWith(expectedOptions);
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
			from: 'from@au.foo.com',
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
		expect(mailerMock.sendMail).toHaveBeenCalledWith(expectedOptions);
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
});
