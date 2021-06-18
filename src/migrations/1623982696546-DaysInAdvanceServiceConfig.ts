import { MigrationInterface, QueryRunner } from 'typeorm';

export class DaysInAdvanceServiceConfig1623982696546 implements MigrationInterface {
	name = 'DaysInAdvanceServiceConfig1623982696546';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_minDaysInAdvance" integer`);
		await queryRunner.query(`ALTER TABLE "service" ADD "_maxDaysInAdvance" integer`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_maxDaysInAdvance"`);
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_minDaysInAdvance"`);
	}
}
