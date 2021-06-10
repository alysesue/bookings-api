import { SettingsRepository } from '../settings.repository';
import { Container } from 'typescript-ioc';
import { TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

describe('Test setting repository', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('Should call findOne', async () => {
		const set = { ah: 'ah' };
		TransactionManagerMock.findOne.mockReturnValue({ data: set });
		const res = await Container.get(SettingsRepository).getSettings();
		expect(res).toBe(set);
	});

	it('Should call findOne return error if not defined or data not define', async () => {
		try {
			await Container.get(SettingsRepository).getSettings();
		} catch (e) {
			expect(e.message).toBe('Setting not found.');
		}
		try {
			TransactionManagerMock.findOne.mockReturnValue({});
			await Container.get(SettingsRepository).getSettings();
		} catch (e) {
			expect(e.message).toBe('Setting not found.');
		}
	});
});
