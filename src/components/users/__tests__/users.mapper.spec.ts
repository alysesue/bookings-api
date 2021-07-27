import { User } from '../../../models';
import { UserProfileMapper } from '../users.mapper';
import * as uuid from 'uuid';
import { AnonymousAuthGroup } from '../../../infrastructure/auth/authGroup';

describe('Users mapper', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should map anonymous user', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });

		const response = UserProfileMapper.mapUserToResponse(anonymous);
		expect(response).toEqual({ userType: 'anonymous' });
	});

	it('should map anonymous group', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const group = new AnonymousAuthGroup(anonymous);

		const response = UserProfileMapper.mapGroupsToResponse([group]);
		expect(response).toEqual([
			{
				authGroupType: 'anonymous',
				anonymous: {
					bookingUUID: undefined,
				},
			},
		]);
	});
});
