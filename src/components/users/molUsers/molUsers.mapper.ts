import { Organisation, Service } from '../../../models';
import {
	MolServiceProviderOnboardContract,
	MolServiceProviderWithGroups,
} from '../../serviceProviders/serviceProviders.apicontract';
import { UserGroupParser } from '../../../infrastructure/auth/userGroupParser';
import { MolServiceAdminUserContract, MolServiceAdminUserWithGroups } from './molUsers.apicontract';
import { trimFields } from '../../../tools/object';

export class MolUsersMapper {
	public static mapServiceProviderGroup(
		serviceProviderOnboardContracts: MolServiceProviderOnboardContract[],
		orga: Organisation,
	): MolServiceProviderWithGroups[] {
		return serviceProviderOnboardContracts.map((serviceProvider) => {
			const groups = [
				UserGroupParser.generateServiceProviderUserGroup(orga._organisationAdminGroupMap.organisationRef),
			];

			return trimFields({ ...serviceProvider, groups });
		});
	}

	public static mapServicesAdminsGroups(
		molAdminUserContracts: MolServiceAdminUserContract[],
		orga: Organisation,
	): MolServiceAdminUserWithGroups[] {
		return molAdminUserContracts.map((admin) => {
			const groups = admin.serviceNames?.map((serviceName) =>
				UserGroupParser.generateServiceAdminUserGroup(
					Service.create(serviceName, orga).serviceAdminGroupMap.serviceOrganisationRef,
				),
			);

			return trimFields({ ...admin, groups });
		});
	}
}