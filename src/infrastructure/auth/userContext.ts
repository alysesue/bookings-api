import { Inject, InRequestScope } from 'typescript-ioc';
import { ContainerContext } from '../containerContext.middleware';
import { User } from '../../models';
import { UsersService } from '../../components/users/users.service';
import { AnonymousAuthGroup, AuthGroup, CitizenAuthGroup } from './authGroup';
import { AsyncLazy } from '../../tools/asyncLazy';

@InRequestScope
export class UserContext {
	@Inject
	private containerContext: ContainerContext;
	private _requestHeaders: any;
	private _currentUser: AsyncLazy<User>;
	private _authGroups: AsyncLazy<AuthGroup[]>;

	constructor() {
		this.init({ requestHeaders: {} });
	}

	public init({ requestHeaders }: { requestHeaders: any }) {
		this._requestHeaders = requestHeaders || {};
		this._currentUser = new AsyncLazy(this.getCurrentUserInternal.bind(this));
		this._authGroups = new AsyncLazy(this.getAuthGroupsInternal.bind(this));
	}

	public setAnonymousUser(user: User): void {
		if (!user) return;

		const authGroup = new AnonymousAuthGroup(user);
		this._currentUser = new AsyncLazy(() => Promise.resolve<User>(user));
		this._authGroups = new AsyncLazy(() => Promise.resolve<AuthGroup[]>([authGroup]));
	}

	public async getCurrentUser(): Promise<User> {
		return await this._currentUser.getValue();
	}

	public async getAuthGroups(): Promise<AuthGroup[]> {
		return await this._authGroups.getValue();
	}

	private async getCurrentUserInternal(): Promise<User> {
		const usersService = this.containerContext.resolve(UsersService);
		return await usersService.getOrSaveUserFromHeaders(this._requestHeaders);
	}

	private async getAuthGroupsInternal(): Promise<AuthGroup[]> {
		const user = await this.getCurrentUser();
		if (!user) {
			return [];
		}

		if (user.isCitizen()) {
			return [new CitizenAuthGroup(user)];
		} else {
			const usersService = this.containerContext.resolve(UsersService);
			return await usersService.getUserGroupsFromHeaders(user, this._requestHeaders);
		}
	}
}
