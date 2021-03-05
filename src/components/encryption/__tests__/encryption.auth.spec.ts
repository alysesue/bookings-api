import { User } from '../../../models/entities';
import * as uuid from 'uuid';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { AnonymousAuthGroup, CitizenAuthGroup } from '../../../infrastructure/auth/authGroup';
import { Container } from 'typescript-ioc';
import { EncryptionAuthVisitor, EncryptionSignatureUser } from '../encryption.auth';
import { UserContext } from '../../../infrastructure/auth/userContext';

describe('Test encryption auth', () => {
	const anonymousUser = User.createAnonymousUser({
		createdAt: new Date(),
		trackingId: uuid.v4(),
	});
	const singPassUinFin = 'userUinFin';
	const singPassUser = User.createSingPassUser('mol', singPassUinFin);

	beforeAll(() => {
		Container.bind(UserContext).to(UserContextMock);
	});
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('Should do nothing if anonymous and no signature', async () => {
		UserContextMock.getSnapshot.mockImplementation(() =>
			Promise.resolve({ user: anonymousUser, authGroups: [new AnonymousAuthGroup(anonymousUser)] }),
		);
		new EncryptionAuthVisitor().validateSignature(await UserContextMock.getSnapshot());
		expect(UserContextMock.getSnapshot).toHaveBeenCalled();
	});

	it('Should return error if anonymous and signature', async () => {
		UserContextMock.getSnapshot.mockImplementation(() =>
			Promise.resolve({ user: anonymousUser, authGroups: [new AnonymousAuthGroup(anonymousUser)] }),
		);
		try {
			new EncryptionAuthVisitor({} as EncryptionSignatureUser).validateSignature(
				await UserContextMock.getSnapshot(),
			);
		} catch (e) {
			expect(e.message).toBe('Current user cannot decrypt a signed message');
		}
		expect(UserContextMock.getSnapshot).toHaveBeenCalled();
	});

	it('Should return error if singPassUser and no signature', async () => {
		UserContextMock.getSnapshot.mockImplementation(() =>
			Promise.resolve({ user: singPassUser, authGroups: [new CitizenAuthGroup(singPassUser)] }),
		);
		try {
			new EncryptionAuthVisitor().validateSignature(await UserContextMock.getSnapshot());
		} catch (e) {
			expect(e.message).toBe('This user cannot decrypt this message.');
		}
	});

	it('Should do nothing if singPassUser and  signature', async () => {
		UserContextMock.getSnapshot.mockImplementation(() =>
			Promise.resolve({ user: singPassUser, authGroups: [new CitizenAuthGroup(singPassUser)] }),
		);
		new EncryptionAuthVisitor({ user: 'singpassUser', code: singPassUinFin }).validateSignature(
			await UserContextMock.getSnapshot(),
		);
		expect(UserContextMock.getSnapshot).toHaveBeenCalled();
	});
});
