import { QueryAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';
import {
	AuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { UserConditionParams } from '../../infrastructure/auth/authConditionCollection';

export class BookingChangeLogsQueryAuthVisitor extends QueryAuthGroupVisitor {
	private readonly _alias: string;

	constructor(alias: string) {
		super();
		this._alias = alias;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const authorisedOrganisationIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(`${this._alias}."_organisationId" IN (:...authorisedOrganisationIds)`, {
			authorisedOrganisationIds,
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const authorisedServiceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addAuthCondition(`${this._alias}."_serviceId" IN (:...authorisedServiceIds)`, {
			authorisedServiceIds,
		});
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const authorisedServiceProviderIds = _userGroup.authorisedServiceProvider.id;
		this.addAuthCondition(`${this._alias}."serviceProviderId" = :authorisedServiceProviderIds`, {
			authorisedServiceProviderIds,
		});
	}
}

class BookingChangeLogsQueryNoAuthVisitor extends BookingChangeLogsQueryAuthVisitor {
	public async createUserVisibilityCondition(authGroups: AuthGroup[]): Promise<UserConditionParams> {
		this.addAsTrue();
		return this.getVisibilityCondition();
	}
}

export class BookingChangeLogQueryVisitorFactory {
	public static getBookingChangeLogQueryVisitor(byPassAuth: boolean): BookingChangeLogsQueryAuthVisitor {
		if (byPassAuth) {
			return new BookingChangeLogsQueryNoAuthVisitor('bookingChangeLog');
		}
		return new BookingChangeLogsQueryAuthVisitor('bookingChangeLog');
	}
}
