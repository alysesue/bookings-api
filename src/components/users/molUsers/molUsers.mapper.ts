import { Organisation, Service } from '../../../models';
import {
	MolServiceProviderOnboard,
	MolServiceProviderOnboardContract,
} from '../../serviceProviders/serviceProviders.apicontract';
import { UserGroupParser } from '../../../infrastructure/auth/userGroupParser';
import { MolAdminUser, MolAdminUserContract } from './molUsers.apicontract';

export class MolUsersMapper {
	public static mapServiceProviderGroup(
		serviceProviderOnboardContracts: MolServiceProviderOnboardContract[],
		orga: Organisation,
	): MolServiceProviderOnboard[] {
		return serviceProviderOnboardContracts.map((serviceProvider) => {
			const molServiceProviderOnboard: MolServiceProviderOnboard = { ...serviceProvider };
			molServiceProviderOnboard.groups = [
				UserGroupParser.generateServiceProviderUserGroup(orga._organisationAdminGroupMap.organisationRef),
			];
			return molServiceProviderOnboard;
		});
	}

	public static mapServicesAdminsGroups(
		molAdminUserContracts: MolAdminUserContract[],
		orga: Organisation,
	): MolAdminUser[] {
		return molAdminUserContracts.map((admin) => {
			const molAdminUsers: MolAdminUser = { ...admin };
			molAdminUsers.groups = admin.services?.map((serviceName) =>
				UserGroupParser.generateServiceAdminUserGroup(
					Service.create(serviceName, orga).serviceAdminGroupMap.serviceOrganisationRef,
				),
			);
			return molAdminUsers;
		});
	}
}
