import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceDescription1623112179998 implements MigrationInterface {
	name = 'ServiceDescription1623112179998';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_description" character varying(100)`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_description"`);
	}
}
