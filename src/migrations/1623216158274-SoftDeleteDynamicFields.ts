import { MigrationInterface, QueryRunner } from 'typeorm';

export class SoftDeleteDynamicFields1623216158274 implements MigrationInterface {
	name = 'SoftDeleteDynamicFields1623216158274';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "dynamic_field" ADD "_deletedAt" TIMESTAMP`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "dynamic_field" DROP COLUMN "_deletedAt"`);
	}
}
