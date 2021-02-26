import { SettingsRepository } from '../settings.repository';
import { Container } from 'typescript-ioc';
import { TransactionManager } from '../../../core/transactionManager';
import { InnerRepositoryMock, TransactionManagerMock } from '../../../infrastructure/tests/dbconnectionmock';

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

describe('Test setting repository', () => {
	it('Should call findOne', async () => {
		const set = { ah: 'ah' };
		InnerRepositoryMock.findOne.mockReturnValue({ data: set });
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
			InnerRepositoryMock.findOne.mockReturnValue({});
			await Container.get(SettingsRepository).getSettings();
		} catch (e) {
			expect(e.message).toBe('Setting not found.');
		}
	});
});
