// tslint:disable: tsr-detect-possible-timing-attacks
import {
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { TimeslotsSchedule } from '../../models';
import { Inject } from 'typescript-ioc';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { ServicesService } from '../services/services.service';

export class TimeslotItemsActionAuthVisitor implements IAuthGroupVisitor {
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private servicesService: ServicesService;

	private _timeslotSchedule: TimeslotsSchedule;
	private _hasPermission: boolean;
	constructor(timeslotSchedule: TimeslotsSchedule) {
		if (!timeslotSchedule) {
			throw new Error('TimeslotItemsActionAuthVisitor - Timeslot Schedule cannot be null');
		}
		if (!timeslotSchedule.service && !timeslotSchedule.serviceProvider) {
			throw new Error(
				'TimeslotItemsActionAuthVisitor - Timeslot Schedule does not belong to any service nor service provider',
			);
		}

		this._timeslotSchedule = timeslotSchedule;
		this._hasPermission = false;
	}

	public async hasPermission(authGroups: AuthGroup[]): Promise<boolean> {
		for (const group of authGroups) {
			await group.acceptVisitor(this);
		}

		return this._hasPermission;
	}

	private markWithPermission(): void {
		// if any role has permission the result will be true.
		this._hasPermission = true;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public async visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): Promise<void> {
		if (this._timeslotSchedule._service) {
			const service = await this.servicesService.getService(this._timeslotSchedule.service.id);
			if (_userGroup.hasOrganisationId(service.organisationId)) {
				this.markWithPermission();
			}
		} else if (this._timeslotSchedule._serviceProvider) {
			const serviceProvider = await this.serviceProvidersService.getServiceProvider(
				this._timeslotSchedule._serviceProvider.id,
			);
			if (_userGroup.hasOrganisationId(serviceProvider.service.organisationId)) {
				this.markWithPermission();
			}
		} else {
		}
	}

	public async visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): Promise<void> {
		if (this._timeslotSchedule._service && _userGroup.hasServiceId(this._timeslotSchedule._service.id)) {
			this.markWithPermission();
		} else if (this._timeslotSchedule._serviceProvider) {
			const serviceProvider = await this.serviceProvidersService.getServiceProvider(
				this._timeslotSchedule._serviceProvider.id,
			);
			if (_userGroup.hasServiceId(serviceProvider.serviceId)) {
				this.markWithPermission();
			}
		} else {
		}
	}
	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		if (
			(this._timeslotSchedule._service &&
				_userGroup.authorisedServiceProvider.service.id === this._timeslotSchedule._service.id) ||
			(this._timeslotSchedule._serviceProvider &&
				_userGroup.authorisedServiceProvider.id === this._timeslotSchedule._serviceProvider.id)
		) {
			this.markWithPermission();
		}
	}
}
