import { Organisation, Service } from '../../../models';
import {
	MolServiceProviderOnboardContract,
	MolServiceProviderWithGroups,
} from '../../serviceProviders/serviceProviders.apicontract';
import { UserGroupParser } from '../../../infrastructure/auth/userGroupParser';
import { MolAdminUserContract, MolAdminUserWithGroups } from './molUsers.apicontract';
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
		molAdminUserContracts: MolAdminUserContract[],
		orga: Organisation,
	): MolAdminUserWithGroups[] {
		return molAdminUserContracts.map((admin) => {
			const groups = admin.services?.map((serviceName) =>
				UserGroupParser.generateServiceAdminUserGroup(
					Service.create(serviceName, orga).serviceAdminGroupMap.serviceOrganisationRef,
				),
			);

			return trimFields({ ...admin, groups });
		});
	}
}
