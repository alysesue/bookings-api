import { RepositoryBase } from '../../core/repository';
import { Label } from '../../models/entities';
import { InRequestScope } from 'typescript-ioc';

@InRequestScope
export class LabelsRepository extends RepositoryBase<Label> {
	constructor() {
		super(Label);
	}

	public async save(data: Label[]): Promise<Label[]> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async find(serviceId: number): Promise<Label[]> {
		const rep = await this.getRepository();
		return rep.find({ where: { _serviceId: serviceId } });
	}
}
