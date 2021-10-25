import { getConfig } from './../../../config/app-config';
import { Container } from 'typescript-ioc';
import { NotificationsService } from '../notifications.service';
import { CreateEmail } from 'mol-lib-api-contract/notification/mail';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract/error';
// import { mailer } from '../../../config/mailer';
import axios from 'axios';

jest.mock('axios');
jest.mock('../../../config/app-config', () => {
	const configMock = {
		isLocal: true,
		awsLambdaMailer: {
			baseUrl: 'https:www.google.com',
			apikey: '1234567',
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
	const axiosMock = axios.request as jest.Mock;

	beforeEach(() => {
		jest.resetAllMocks();
		axiosMock.mockImplementation(() =>
			Promise.resolve({
				data: JSON.stringify({
					accepted: ['success@foo.com'],
					rejected: [],
					messageId: 'messageId',
				}),
			}),
		);
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

	it('should throw error when any email is invalid', async () => {
		const options: CreateEmail.Domain.CreateEmailRequestApiDomain = {
			to: ['valid@email.com', 'INVALID EMAIL'],
			subject: 'Single recipient',
			html: '<h1>Single recipient</h1>',
		};

		const invalidEmailError = new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setMessage('Invalid email address');
		const instance = await Container.get(NotificationsService);
		await expect(instance.sendEmail(options)).rejects.toEqual(invalidEmailError);
	});

	it('should send mail to single recipient', async () => {
		const options: CreateEmail.Domain.CreateEmailRequestApiDomain = {
			from: 'from@foo.com',
			to: ['to@foo.com'],
			subject: 'Single recipient',
			html: '<h1>Single recipient</h1>',
		};
		const expectedOptions = {
			method: 'post',
			url: getConfig().awsLambdaMailer.baseUrl,
			data: JSON.stringify({ ...options, to: options.to.join(',') }),
			headers: { 'x-api-key': getConfig().awsLambdaMailer.apikey },
		};

		const instance = await Container.get(NotificationsService);
		await instance.sendEmail(options);
		expect(axios.request).toHaveBeenCalledWith(expectedOptions);
	});

	it('should send mail to multiple recipients', async () => {
		const options: CreateEmail.Domain.CreateEmailRequestApiDomain = {
			from: 'from@au.foo.com',
			to: ['to@foo.com', 'anotherto@foo.com'],
			subject: 'Multiple recipients',
			html: '<h1>Multiple recipients</h1>',
		};

		const expectedOptions = {
			method: 'post',
			url: getConfig().awsLambdaMailer.baseUrl,
			data: JSON.stringify({ ...options, to: options.to.join(',') }),
			headers: { 'x-api-key': getConfig().awsLambdaMailer.apikey },
		};

		const instance = await Container.get(NotificationsService);
		await instance.sendEmail(options);
		expect(axios.request).toHaveBeenCalledWith(expectedOptions);
	});
});
