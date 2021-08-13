import { MigrationInterface, QueryRunner } from 'typeorm';

export class IsMandatoryDynamicFields1627545990317 implements MigrationInterface {
	name = 'IsMandatoryDynamicFields1627545990317';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "dynamic_field" ADD "_isMandatory" boolean NOT NULL DEFAULT false`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "dynamic_field" DROP COLUMN "_isMandatory"`);
	}
}
