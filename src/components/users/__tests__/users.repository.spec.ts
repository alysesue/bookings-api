import { AdminUser, User } from '../../../models';
import { Container } from 'typescript-ioc';
import { UsersRepository } from '../users.repository';
import { TransactionManager } from '../../../core/transactionManager';
import { IUser } from '../../../models/interfaces';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';

jest.mock('../../../core/transactionManager', () => {
	class TransactionManager {}
	return {
		TransactionManager,
	};
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

const userMock = new User();
userMock.id = 1;

const userMock2 = new User();
userMock2.id = 2;

describe('User repository', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should getUserByTrackingId', async () => {
		const queryBuilderMock = {
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUserByTrackingId('d080f6ed-3b47-478a-a6c6-dfb5608a199d');
		expect(result).toStrictEqual([userMock]);
	});

	it('should not getUserByTrackingId when id is null', async () => {
		const queryBuilderMock = {
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const resultA = await userRepository.getUserByTrackingId(null);
		const resultB = await userRepository.getUserByTrackingId();
		expect(resultA).toBeNull();
		expect(resultB).toBeNull();
	});

	it('should save user', async () => {
		const saveResult = [{ id: 'abc' }];
		TransactionManagerMock.save.mockImplementation(() => saveResult);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.save({} as User);
		expect(result).toStrictEqual([{ id: 'abc' }]);
	});

	it('should find and save user', async () => {
		userMock.adminUser = {} as AdminUser;
		userMock.adminUser.agencyUserId = '1';
		userMock.adminUser._User = {} as IUser;
		userMock.adminUser._User.id = 1;
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		TransactionManagerMock.save.mockImplementation(() => userMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.save(userMock);
		expect(result).toStrictEqual(userMock);
	});

	it('should getUserByMobileNo', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUserByMobileNo('+6584000000');
		expect(result).toStrictEqual([userMock]);
	});

	it('should getUserByMolUserId', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUserByMolUserId('d080f6ed-3b47-478a-a6c6-dfb5608a199d');
		expect(result).toStrictEqual([userMock]);
	});

	it('should getUserByUinFin', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUserByUinFin('S1234567D');
		expect(result).toStrictEqual([userMock]);
	});

	it('should not getUserByMolUserId when id is null', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const resultA = await userRepository.getUserByMolUserId(null);
		const resultB = await userRepository.getUserByMolUserId();
		expect(resultA).toBeNull();
		expect(resultB).toBeNull();
	});

	it('should getUserByMolAdminId', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUserByMolAdminId('d080f6ed-3b47-478a-a6c6-dfb5608a199d');
		expect(result).toStrictEqual([userMock]);
	});

	it('should getUserByMolAdminIds', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([userMock, userMock2])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUsersByMolAdminIds([
			'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			'd080f6ed-3b47-478a-a6c6-dfb5608a199e',
		]);
		expect(result).toStrictEqual([userMock, userMock2]);
	});

	it('should getUserByAgencyAppId', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const result = await userRepository.getUserByAgencyAppId('d080f6ed-3b47-478a-a6c6-dfb5608a199d');
		expect(result).toStrictEqual([userMock]);
	});

	it('should not getUserByMolAdminId when id is null', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const resultA = await userRepository.getUserByMolAdminId(null);
		const resultB = await userRepository.getUserByMolAdminId();
		expect(resultA).toBeNull();
		expect(resultB).toBeNull();
	});

	it('should not getUserByAgencyAppId  when id is null', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			orderBy: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve([userMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const userRepository = Container.get(UsersRepository);

		const resultA = await userRepository.getUserByAgencyAppId(null);
		const resultB = await userRepository.getUserByAgencyAppId();
		expect(resultA).toBeNull();
		expect(resultB).toBeNull();
	});
});
