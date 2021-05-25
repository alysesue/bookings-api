import { MigrationInterface, QueryRunner } from 'typeorm';

export class TimeslotItemIndex1621323938147 implements MigrationInterface {
	name = 'TimeslotItemIndex1621323938147';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE INDEX "IDX_59c31a55475155e379b6c92f4c" ON "timeslot_item" ("_timeslotsScheduleId") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_3cdc7bf0e4039e74de23292751" ON "service_provider" ("_timeslotsScheduleId") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_3cdc7bf0e4039e74de23292751"`);
		await queryRunner.query(`DROP INDEX "IDX_59c31a55475155e379b6c92f4c"`);
	}
}
