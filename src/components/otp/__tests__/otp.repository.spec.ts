import { TransactionManagerMock } from './../../../core/__mocks__/transactionManager.mock';
import { Otp } from './../../../models/entities/otp';
import { Container } from 'typescript-ioc';
import { OtpRepository } from './../otp.repository';
import { TransactionManager } from '../../../core/transactionManager';
import * as appConfig from './../../../config/app-config';

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

beforeEach(() => {
	jest.spyOn(appConfig, 'getConfig').mockReturnValue({ ...appConfig.getConfig(), otpEnabled: false });
});

afterEach(() => {
	jest.resetAllMocks();
});

afterAll(() => {
	jest.spyOn(appConfig, 'getConfig').mockRestore();
	if (global.gc) global.gc();
});

describe('otp repository', () => {
	it('should save otp', async () => {
		const otp = Otp.create('+6588884444');
		const otpRepo = Container.get(OtpRepository);

		await otpRepo.save(otp);
		expect(TransactionManagerMock.save).toBeCalledTimes(1);
	});

	describe('getNonExpiredOtp', () => {
		it('should return undefined when otpReqId is not found in database', async () => {
			const otpRepo = Container.get(OtpRepository);
			TransactionManagerMock.findOne.mockReturnValue(undefined);

			const otp = await otpRepo.getNonExpiredOtp('6dd2513a-9679-49d2-b305-94a390d151ad', 3 * 60);

			expect(TransactionManagerMock.findOne).toBeCalledTimes(1);
			expect(otp).toBeUndefined();
		});

		it('should return undefined when otp has expired', async () => {
			const otpReqId = '6dd2513a-9679-49d2-b305-94a390d151ad';
			const otpRepo = Container.get(OtpRepository);
			const expiredOtp = Otp.create('+6588884444');
			expiredOtp._createdAt = new Date(2020, 3, 27);
			expiredOtp._requestId = otpReqId;
			TransactionManagerMock.findOne.mockReturnValue(expiredOtp);
			jest.spyOn(Date, 'now').mockReturnValueOnce(1587916981000); // unix time for 2020-04-27, 00:03:01

			const otp = await otpRepo.getNonExpiredOtp(otpReqId, 3 * 60);

			expect(TransactionManagerMock.findOne).toBeCalledTimes(1);
			expect(otp).toBeUndefined();

			jest.spyOn(global, 'Date').mockRestore();
		});

		it('should return otp which has not expired', async () => {
			const otpReqId = '6dd2513a-9679-49d2-b305-94a390d151ad';
			const otpRepo = Container.get(OtpRepository);
			const validOtp = Otp.create('+6588884444');
			validOtp._createdAt = new Date(2020, 3, 27);
			validOtp._requestId = otpReqId;
			TransactionManagerMock.findOne.mockReturnValue(validOtp);
			jest.spyOn(Date, 'now').mockReturnValueOnce(1587916980000); // unix time for 2020-04-27, 00:03:00

			const otp = await otpRepo.getNonExpiredOtp(otpReqId, 3 * 60);

			expect(TransactionManagerMock.findOne).toBeCalledTimes(1);
			expect(otp).toEqual(validOtp);

			jest.spyOn(global, 'Date').mockRestore();
		});
	});
});
