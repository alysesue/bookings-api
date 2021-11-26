import {
	AnonymousAuthGroup,
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { User } from '../../models';
import {
	AdminUserContract,
	AgencyUserContract,
	AuthGroupResponseV1,
	AuthGroupResponseV2,
	AuthGroupTypeContract,
	OrganisationAdminGroupContractV1,
	OrganisationAdminGroupContractV2,
	ServiceAdminGroupContractV1,
	ServiceAdminGroupContractV2,
	OtpAddOn,
	SingPassUserContract,
	UserProfileResponseV1,
	UserProfileResponseV2,
	UserTypeContract,
	UserTypeResponse,
} from './users.apicontract';
import { Inject } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';

export class UserProfileMapper {
	public static mapUserToResponse(user: User): UserTypeResponse {
		const instance = new UserTypeResponse();
		if (user.isSingPass()) {
			instance.userType = UserTypeContract.singpass;
			instance.singpass = new SingPassUserContract();
			instance.singpass.uinfin = user.singPassUser.UinFin;
		} else if (user.isAdmin()) {
			instance.userType = UserTypeContract.admin;
			instance.admin = new AdminUserContract();
			instance.admin.email = user.adminUser.email;
			instance.admin.agencyUserId = user.adminUser.agencyUserId;
			instance.admin.name = user.adminUser.name;
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

	public static mapGroupsToResponseV1(groups: AuthGroup[]): AuthGroupResponseV1[] {
		return new AuthGroupResponseVisitorV1().getMappedGroups(groups);
	}

	public static mapGroupsToResponseV2(groups: AuthGroup[]): AuthGroupResponseV2[] {
		return new AuthGroupResponseVisitorV2().getMappedGroups(groups);
	}

	public static mapToResponseV1({
		user,
		groups,
		otpAddOnMobileNo,
	}: {
		user: User;
		groups: AuthGroup[];
		otpAddOnMobileNo?: string;
	}): UserProfileResponseV1 {
		const response = new UserProfileResponseV1();
		response.user = UserProfileMapper.mapUserToResponse(user);
		response.groups = UserProfileMapper.mapGroupsToResponseV1(groups);
		if (otpAddOnMobileNo) {
			const otpAddOn = new OtpAddOn();
			otpAddOn.mobileNo = otpAddOnMobileNo;
			response.otpAddon = otpAddOn;
		}

		return response;
	}

	public static mapToResponseV2({
		user,
		groups,
		otpAddOnMobileNo,
	}: {
		user: User;
		groups: AuthGroup[];
		otpAddOnMobileNo?: string;
	}): UserProfileResponseV2 {
		const response = new UserProfileResponseV2();
		response.user = UserProfileMapper.mapUserToResponse(user);
		response.groups = UserProfileMapper.mapGroupsToResponseV2(groups);
		if (otpAddOnMobileNo) {
			const otpAddOn = new OtpAddOn();
			otpAddOn.mobileNo = otpAddOnMobileNo;
			response.otpAddon = otpAddOn;
		}
		return response;
	}
}

class AuthGroupResponseVisitorV1 implements IAuthGroupVisitor {
	private _mappedGroups: AuthGroupResponseV1[];

	constructor() {
		this._mappedGroups = [];
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.anonymous,
			anonymous: {
				bookingUUID: _anonymousGroup.bookingInfo?.bookingUUID,
			},
		});
	}

	public visitOtp(_visitOtp: OtpAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.otp,
		});
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.citizen,
		});
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.organisationAdmin,
			organisations: _userGroup.authorisedOrganisations.map<OrganisationAdminGroupContractV1>((o) => ({
				id: o.id,
				name: o.name,
			})),
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.serviceAdmin,
			services: _userGroup.authorisedServices.map<ServiceAdminGroupContractV1>((s) => ({
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

	public getMappedGroups(groups: AuthGroup[]): AuthGroupResponseV1[] {
		for (const group of groups) {
			group.acceptVisitor(this);
		}
		return this._mappedGroups;
	}
}

class AuthGroupResponseVisitorV2 implements IAuthGroupVisitor {
	@Inject
	private idHasher: IdHasher;

	private _mappedGroups: AuthGroupResponseV2[];

	constructor() {
		this._mappedGroups = [];
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.anonymous,
			anonymous: {
				bookingUUID: _anonymousGroup.bookingInfo?.bookingUUID,
			},
		});
	}

	public visitOtp(_visitOtp: OtpAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.otp,
		});
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.citizen,
		});
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisations: OrganisationAdminGroupContractV2[] = [];

		for (const organisation of _userGroup.authorisedOrganisations) {
			const signedId = this.idHasher.encode(organisation.id);
			organisations.push({
				id: signedId,
				name: organisation.name,
			});
		}

		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.organisationAdmin,
			organisations,
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const services: ServiceAdminGroupContractV2[] = [];

		for (const service of _userGroup.authorisedServices) {
			const signedId = this.idHasher.encode(service.id);
			services.push({
				id: signedId,
				name: service.name,
			});
		}

		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.serviceAdmin,
			services,
		});
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const sp = _userGroup.authorisedServiceProvider;
		const signedId = this.idHasher.encode(sp.id);

		this._mappedGroups.push({
			authGroupType: AuthGroupTypeContract.serviceProvider,
			serviceProvider: {
				id: signedId,
				name: sp.name,
			},
		});
	}

	public getMappedGroups(groups: AuthGroup[]): AuthGroupResponseV2[] {
		for (const group of groups) {
			group.acceptVisitor(this);
		}
		return this._mappedGroups;
	}
}
