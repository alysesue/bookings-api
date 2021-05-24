import { MigrationInterface, QueryRunner } from 'typeorm';

export class CapacityForScheduleForm1620205273706 implements MigrationInterface {
	name = 'capacityForSchedule1620205273706';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "week_day_schedule" ADD "capacity" integer NOT NULL DEFAULT '1'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "week_day_schedule" DROP COLUMN "capacity"`);
	}
}
