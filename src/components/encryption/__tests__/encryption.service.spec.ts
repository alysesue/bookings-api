import { Container } from 'typescript-ioc';
import { EncryptionService, GenericEncryptionData } from '../encryption.service';
import { getConfig } from '../../../config/app-config';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { EncryptionAuthVisitor } from '../encryption.auth';
import { EncryptionAuthVisitorMock } from '../__mocks__/encryption.auth.mock';
import { AnonymousAuthGroup } from '../../../infrastructure/auth/authGroup';
import { User } from '../../../models/entities';
import * as uuid from 'uuid';

jest.mock('../../../config/app-config');

describe('Test encryption service', () => {
	beforeAll(() => {
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(EncryptionAuthVisitor).to(EncryptionAuthVisitorMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		(getConfig as jest.Mock).mockReturnValue({
			encryptionKey: '4hvph+8VIlDtm4e7e917gS1IyKbSYocKjylHsMdJYkg=',
		});
		EncryptionAuthVisitorMock.validatedSignatureMock.mockImplementationOnce(() => {});
		const anonymousUser = User.createAnonymousUser({
			createdAt: new Date(),
			trackingId: uuid.v4(),
		});
		UserContextMock.getSnapshot.mockImplementation(() =>
			Promise.resolve({ user: anonymousUser, authGroups: [new AnonymousAuthGroup(anonymousUser)] }),
		);
	});

	it('Should encrypt/decrypt value', async () => {
		const data = { test: 'test' };
		const resEncrypted = await Container.get(EncryptionService).encrypt(data as GenericEncryptionData);
		const decrypted = await Container.get(EncryptionService).decrypt(resEncrypted);
		expect(decrypted).toStrictEqual(data);
	});

	it('Should not decrypt value if date expire', async () => {
		const mockDate = new Date(1466424490000);
		const mockDate2 = new Date(1666434490000);
		jest.spyOn(global, 'Date').mockImplementationOnce(() => (mockDate as unknown) as string);
		jest.spyOn(global, 'Date').mockImplementationOnce(() => (mockDate2 as unknown) as string);
		const spy = jest.spyOn(global, 'Date').mockImplementationOnce(() => (mockDate as unknown) as string);

		const object = { test: 'test' };
		const resEncrypted = await Container.get(EncryptionService).encrypt(object as GenericEncryptionData);
		try {
			await Container.get(EncryptionService).decrypt(resEncrypted);
		} catch (e) {
			spy.mockRestore();
			expect(e.message).toBe('Message expired');
		}
	});

	it('Should encrypt big object and be under 1200 character', async () => {
		const data = {
			serviceId: '120-235-23',
			serviceProvider: '2304-230034-3',
			name: 'Very long name for very important people, but maybe not too long',
			startAt: '1613963836022',
			endAt: '16139632342998',
			email: 'veryLongEmail-ILikeLongEmail_alrightEmail@gmail.com',
			description:
				'Use caution when making use of Experimental features, particularly ' +
				'within modules. Users may not be aware that experimental features are being used.' +
				'Bugs or behavior changes may surprise users when Experimental API modifications occur. ' +
				'To avoid surprises, use of an Experimental feature may need a command-line flag. ' +
				'Experimental features may also emit a warning.',
			otherLongDescription:
				'Singapore (/ˈ(About this soundlisten)), officially the Republic of Singapore, is a sovereign island city-state in maritime Southeast Asia. ' +
				'It lies about one degree of latitude (137 kilometres or 85 miles) north of the equator, off the southern tip of the Malay Peninsula, bordering the Straits ' +
				"of Malacca to the west, the Riau Islands (Indonesia) to the south, and the South China Sea to the east. The country's territory is composed of one main island," +
				" 63 satellite islands and islets, and one outlying islet, the combined area of which has increased by 25% since the country's independence as a result of " +
				'extensive land reclamation projects. It has the second greatest population density in the world. The country has almost 5.7 million residents, 61% (3.4 million) ' +
				'of whom are Singaporean citizens. There are four official languages of Singapore: English, Malay, Chinese and Tamil, with English being the lingua franca. ' +
				'Multiracialism is enshrined in the constitution, and continues to shape national policies in education, housing, and politics.',
			location:
				'1 Geylang Serai bonus long address too ahah damn that really an unpractical address, Singapore 402001',
			phone: '+664929494',
			urlback: 'https:www.best-Url-Ever/super-path',
			urlRedirect:
				'https://www.worsturlever.com/we-like-real-long-path-because-is-not-convenient/#free-inconvienent-url',
		};
		const resEncrypted = await Container.get(EncryptionService).encrypt(data as GenericEncryptionData);
		const decrypted = await Container.get(EncryptionService).decrypt(resEncrypted);
		expect(decrypted).toStrictEqual(data);
	});
});
