import { TransactionManagerMock } from './../../../core/__mocks__/transactionManager.mock';
import { Otp } from './../../../models/entities/otp';
import { Container } from 'typescript-ioc';
import { OtpRepository } from './../otp.repository';
import { TransactionManager } from '../../../core/transactionManager';
import * as appConfig from './../../../config/app-config';

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('otp repository', () => {
	it('should save otp', async () => {
		jest.spyOn(appConfig, 'getConfig').mockReturnValue({ ...appConfig.getConfig(), otpEnabled: false });
		const otp = Otp.create('+6588884444');
		const otpRepo = Container.get(OtpRepository);

		await otpRepo.save(otp);
		expect(TransactionManagerMock.save).toBeCalledTimes(1);

		jest.spyOn(appConfig, 'getConfig').mockRestore();
	});
});
