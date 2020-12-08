import {
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { User } from '../../models';
import {
	AdminUserContract,
	AgencyUserContract,
	AuthGroupResponse,
	AuthGroupTypeContract,
	OrganisationAdminGroupContract,
	ServiceAdminGroupContract,
	SingPassUserContract,
	UserProfileResponse,
	UserTypeContract,
	UserTypeResponse,
} from './users.apicontract';

export class UserProfileMapper {
	public static mapToResponse({ user, groups }: { user: User; groups: AuthGroup[] }): UserProfileResponse {
		const response = new UserProfileResponse();
		response.user = UserProfileMapper.mapUserToResponse(user);
		response.groups = UserProfileMapper.mapGroupsToResponse(groups);
		return response;
	}

	public static mapUserToResponse(user: User): UserTypeResponse {
		const instance = new UserTypeResponse();
		if (user.isCitizen()) {
			instance.userType = UserTypeContract.singpass;
			instance.singpass = new SingPassUserContract();
			instance.singpass.uinfin = user.singPassUser.UinFin;
		} else if (user.isAdmin()) {
			instance.userType = UserTypeContract.admin;
			instance.admin = new AdminUserContract();
			instance.admin.email = user.adminUser.email;
			instance.admin.agencyUserId = user.adminUser.agencyUserId;
		} else if (user.isAgency()) {
			instance.userType = UserTypeContract.agency;
			instance.agency = new AgencyUserContract();
			instance.agency.appId = user.agencyUser.agencyAppId;
			instance.agency.name = user.agencyUser.agencyName;
		} else if (user.isAnonymous()) {
			instance.userType = UserTypeContract.anonymous;
		} else {
			throw new Error('User cannot be mapped to UserTypeResponse. Id: ' + user.id);
		}

		return instance;
	}

	public static mapGroupsToResponse(groups: AuthGroup[]): AuthGroupResponse[] {
		return new AuthGroupResponseVisitor().getMappedGroups(groups);
	}
}

class AuthGroupResponseVisitor implements IAuthGroupVisitor {
	private _mappedGroups: AuthGroupResponse[];
	constructor() {
		this._mappedGroups = [];
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.citizen,
		});
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.organisationAdmin,
			organisations: _userGroup.authorisedOrganisations.map<OrganisationAdminGroupContract>((o) => ({
				id: o.id,
				name: o.name,
			})),
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.serviceAdmin,
			services: _userGroup.authorisedServices.map<ServiceAdminGroupContract>((s) => ({
				id: s.id,
				name: s.name,
			})),
		});
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const sp = _userGroup.authorisedServiceProvider;
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.serviceProvider,
			serviceProvider: {
				id: sp.id,
				name: sp.name,
			},
		});
	}

	public getMappedGroups(groups: AuthGroup[]): AuthGroupResponse[] {
		for (const group of groups) {
			group.acceptVisitor(this);
		}
		return this._mappedGroups;
	}
}
