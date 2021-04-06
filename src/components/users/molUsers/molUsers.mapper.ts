import { Organisation, Service } from '../../../models';
import {
	MolServiceProviderOnboardContract,
	MolServiceProviderWithGroups,
} from '../../serviceProviders/serviceProviders.apicontract';
import { UserGroupParser } from '../../../infrastructure/auth/userGroupParser';
import { MolServiceAdminUserContract, MolServiceAdminUserWithGroups } from './molUsers.apicontract';
import { trimFields } from '../../../tools/object';
import { groupByKeyLastValue } from '../../../tools/collections';

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
		services: Service[],
		orga: Organisation,
	): MolServiceAdminUserWithGroups[] {
		const serviceLookup = groupByKeyLastValue(services, (s) => s.name.toLowerCase());

		return molAdminUserContracts.map((admin) => {
			const groups = admin.serviceNames?.map((serviceName) => {
				const service = serviceLookup.get(serviceName.toLowerCase());
				if (!service) {
					throw new Error(`Service not created yet: ${serviceName}`);
				}
				return UserGroupParser.generateServiceAdminUserGroup(
					service.serviceAdminGroupMap.serviceOrganisationRef,
				);
			});

			return trimFields({ ...admin, groups });
		});
	}
}
