import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceProviderScheduleStartEndDate1626827851656 implements MigrationInterface {
	name = 'ServiceProviderScheduleStartEndDate1626827851656';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "timeslot_item" ADD "_startDate" date`);
		await queryRunner.query(`ALTER TABLE "timeslot_item" ADD "_endDate" date`);
		await queryRunner.query(`ALTER TABLE "week_day_schedule" ADD "startDate" date`);
		await queryRunner.query(`ALTER TABLE "week_day_schedule" ADD "endDate" date`);
		await queryRunner.query(`ALTER TABLE "schedule_form" ADD "startDate" date`);
		await queryRunner.query(`ALTER TABLE "schedule_form" ADD "endDate" date`);
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_reasonToReject"`);
		await queryRunner.query(`ALTER TABLE "booking" ADD "_reasonToReject" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_reasonToReject"`);
		await queryRunner.query(`ALTER TABLE "booking" ADD "_reasonToReject" character varying(300)`);
		await queryRunner.query(`ALTER TABLE "schedule_form" DROP COLUMN "endDate"`);
		await queryRunner.query(`ALTER TABLE "schedule_form" DROP COLUMN "startDate"`);
		await queryRunner.query(`ALTER TABLE "week_day_schedule" DROP COLUMN "endDate"`);
		await queryRunner.query(`ALTER TABLE "week_day_schedule" DROP COLUMN "startDate"`);
		await queryRunner.query(`ALTER TABLE "timeslot_item" DROP COLUMN "_endDate"`);
		await queryRunner.query(`ALTER TABLE "timeslot_item" DROP COLUMN "_startDate"`);
	}
}
