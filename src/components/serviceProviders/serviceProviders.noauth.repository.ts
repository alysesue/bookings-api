import { InRequestScope } from 'typescript-ioc';
import { ServiceProvider } from '../../models';
import { RepositoryBase } from '../../core/repository';

// Repository access without authorisation (used by UserContext)
@InRequestScope
export class ServiceProvidersRepositoryNoAuth extends RepositoryBase<ServiceProvider> {
	public async getServiceProviderByMolAdminId({ molAdminId }: { molAdminId: string }): Promise<ServiceProvider> {
		if (!molAdminId) {
			return null;
		}
		const repository = await this.getRepository();
		// *** Don't filter by user permission here, as this is used by UserContext class
		const query = repository
			.createQueryBuilder('sp')
			.innerJoin('sp._serviceProviderGroupMap', 'spgroup', 'spgroup."_molAdminId" = :molAdminId', { molAdminId })
			.leftJoinAndSelect('sp._calendar', 'calendar');

		return await query.getOne();
	}
}
