import {QueryAuthGroupVisitor} from "../../infrastructure/auth/queryAuthGroupVisitor";
import {
    CitizenAuthGroup,
    OrganisationAdminAuthGroup,
    ServiceAdminAuthGroup,
    ServiceProviderAuthGroup
} from "../../infrastructure/auth/authGroup";

export class BookingChangeLogsQueryAuth extends QueryAuthGroupVisitor {
    private readonly _alias: string;

    constructor(alias: string) {
        super();
        this._alias = alias;
    }

    public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

    public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
        const authorisedOrganisationIds = _userGroup.authorisedOrganisations.map((org) => org.id );
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

    public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {}
}
