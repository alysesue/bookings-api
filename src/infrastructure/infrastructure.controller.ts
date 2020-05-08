import { Inject } from 'typescript-ioc';
import {DbConnection} from '../core/db.connection';
import { Controller, Post, Route } from 'tsoa';

/* istanbul ignore file */

@Route('api/v1/infrastructure')
export class InfrastructureController extends Controller {

	@Inject
	private connection: DbConnection;

	@Post('dbmigrations')
	public async dbmigrations() {
		await this.connection.runMigrations();
	}

	@Post('dbsynchronize')
	public async dbsynchronize() {
		await this.connection.synchronize();
	}

	@Post('throwexception')
	public async throwexception() {
		await this.sampleException();
	}

	private async sampleException() {
		throw new Error('sampleException');
	}
}
