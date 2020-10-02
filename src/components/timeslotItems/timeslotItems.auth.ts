import { IAuthGroupVisitor, CitizenAuthGroup, OrganisationAdminAuthGroup, ServiceAdminAuthGroup, ServiceProviderAuthGroup, AuthGroup } from "../../infrastructure/auth/authGroup";
import { ChangeLogAction, TimeslotItem, TimeslotsSchedule } from "../../models";
import { Inject } from "typescript-ioc";
import { ServiceProvidersService } from "../serviceProviders/serviceProviders.service";
import { ServicesService } from "../services/services.service";

export class TimeslotItemsActionAuthVisitor implements IAuthGroupVisitor {
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private servicesService: ServicesService;

	private _timeslotItem: TimeslotItem;
	private _timeslotSchedule: TimeslotsSchedule;
	private _changeLogAction: ChangeLogAction;
	private _hasPermission: boolean;
	constructor(timeslotSchedule: TimeslotsSchedule, changeLogAction: ChangeLogAction) {
		if (!timeslotSchedule) {
			throw new Error('TimeslotItemsActionAuthVisitor - Timeslot Schedule cannot be null');
		}
		if (!timeslotSchedule.service && !timeslotSchedule.serviceProvider) {
			throw new Error('TimeslotItemsActionAuthVisitor - Timeslot Schedule does not belong to any service nor service provider');
		}
		//		this._timeslotItem = timeslotItem;
		this._timeslotSchedule = timeslotSchedule;
		this._changeLogAction = changeLogAction;
		this._hasPermission = false;
	}



	public hasPermission(authGroups: AuthGroup[]): boolean {
		for (const group of authGroups) {
			group.acceptVisitor(this);
		}

		return this._hasPermission;
	}

	private markWithPermission(): void {
		// if any role has permission the result will be true.
		this._hasPermission = true;
	}


	visitCitizen(_citizenGroup: CitizenAuthGroup): void {
	}

	async visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): Promise<void> {

		if (this._timeslotSchedule._service) {
			const service = await this.servicesService.getService(this._timeslotSchedule.service.id);
			if (_userGroup.hasOrganisationId(service.organisationId)) {
				this.markWithPermission();
			}
		}
		else if (this._timeslotSchedule._serviceProvider) {
			const serviceProvider = await this.serviceProvidersService.getServiceProvider(this._timeslotSchedule._serviceProvider.id);
			if (_userGroup.hasOrganisationId(serviceProvider.service.organisationId)) {
				this.markWithPermission();
			}
		}
		else { }
	}

	async visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): Promise<void> {
		if (this._timeslotSchedule._service && _userGroup.hasServiceId(this._timeslotSchedule._service.id)) {
			this.markWithPermission();
		}
		else if (this._timeslotSchedule._serviceProvider) {
			const serviceProvider = await this.serviceProvidersService.getServiceProvider(this._timeslotSchedule._serviceProvider.id);
			if (_userGroup.hasServiceId(serviceProvider.serviceId)) {
				this.markWithPermission();
			}
		}
		else { }


	}
	visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		if ((this._timeslotSchedule._service && _userGroup.authorisedServiceProvider.service.id === this._timeslotSchedule._service.id)
			|| (this._timeslotSchedule._serviceProvider && _userGroup.authorisedServiceProvider.id === this._timeslotSchedule._serviceProvider.id)) {
			this.markWithPermission();
		}
	}


}
