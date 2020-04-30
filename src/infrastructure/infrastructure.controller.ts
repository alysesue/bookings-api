import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { Inject } from 'typescript-ioc';
import { DbConnection } from '../core/db.connection'
import { Controller, Post, Route } from 'tsoa';

@Route('api/v1/infrastructure')
export class InfrastructureController extends Controller {

	@Inject
	private connection: DbConnection;

	@Post('dbmigrations')
	public async dbmigrations() {
		try {
			await this.connection.runMigrations();
		} catch (err) {
			logger.error('endpoint/dbmigrations:: error: ', err);
			throw err;
		}
	}

	@Post('dbsynchronize')
	public async dbsynchronize() {
		try {
			await this.connection.synchronize();
		} catch (err) {
			logger.error('endpoint/dbsynchronize:: error: ', err);
			throw err;
		}
	}
}
