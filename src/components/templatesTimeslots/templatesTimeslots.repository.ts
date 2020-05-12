import { Inject, Singleton } from 'typescript-ioc';

import { DbConnection } from '../../core/db.connection';
import { TemplateTimeslots } from '../../models/templateTimeslots';
import { DeleteResult, Repository } from "typeorm";

@Singleton
export class TemplatesTimeslotsRepository {
	@Inject
	private connection: DbConnection;

	public async getTemplateTimeslotsById(id: number): Promise<TemplateTimeslots> {
		return (await this.getRepository()).findOne({id});
	}

	public async getTemplateTimeslotsByName(name: string): Promise<TemplateTimeslots> {
		return (await this.getRepository()).findOne({name});
	}

	public async setTemplateTimeslots(timeslot: TemplateTimeslots): Promise<TemplateTimeslots> {
		return (await this.getRepository()).save(timeslot);
	}

	public async deleteTemplateTimeslots(timeslotId: number): Promise<DeleteResult> {
		return (await this.getRepository()).delete(timeslotId);
	}

	private async getRepository(): Promise<Repository<TemplateTimeslots>> {
		const conn = await this.connection.getConnection();
		return conn.getRepository(TemplateTimeslots);
	}
}
