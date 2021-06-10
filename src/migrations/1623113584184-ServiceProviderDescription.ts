import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceProviderDescription1623113584184 implements MigrationInterface {
	name = 'ServiceProviderDescription1623113584184';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service_provider" ADD "_description" character varying(100)`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service_provider" DROP COLUMN "_description"`);
	}
}
