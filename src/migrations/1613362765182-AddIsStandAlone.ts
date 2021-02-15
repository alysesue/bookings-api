import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsStandAlone1613362765182 implements MigrationInterface {
	public name = 'AddIsStandAlone1613362765182';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_isStandAlone" boolean DEFAULT false`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_isStandAlone"`);
	}
}
