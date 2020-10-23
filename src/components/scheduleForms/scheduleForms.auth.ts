// tslint:disable: tsr-detect-possible-timing-attacks
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { ScheduleForm, ServiceProvider } from '../../models';
import { PermissionAwareAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';

export class ScheduleFormsActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private _scheduleForm: ScheduleForm;
	private _serviceProvider: ServiceProvider;
	constructor(serviceProvider: ServiceProvider, scheduleForm: ScheduleForm) {
		super();
		if (!serviceProvider) {
			throw new Error('ScheduleFormsActionAuthVisitor - ScheduleForm cannot be null.');
		}
		if (serviceProvider && !serviceProvider.service) {
			throw new Error('ScheduleFormsActionAuthVisitor - Service is not loaded in Service Provider.');
		}

		this._scheduleForm = scheduleForm;
		this._serviceProvider = serviceProvider;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._serviceProvider.service.organisationId;
		if (_userGroup.hasOrganisationId(organisationId)) {
			this.markWithPermission();
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceId = this._serviceProvider.serviceId;
		if (_userGroup.hasServiceId(serviceId)) {
			this.markWithPermission();
		}
	}
	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderId = this._serviceProvider.id;
		// tslint:disable-next-line: tsr-detect-possible-timing-attacks
		if (_userGroup.authorisedServiceProvider.id === serviceProviderId) {
			this.markWithPermission();
		}
	}
}
