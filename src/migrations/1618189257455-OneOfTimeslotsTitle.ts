import { MigrationInterface, QueryRunner } from 'typeorm';

export class OneOfTimeslotsTitle1618189257455 implements MigrationInterface {
	public name = 'OneOfTimeslotsTitle1618189257455';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" ADD "_title" character varying(5000)`);
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" ADD "_description" character varying(5000)`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" DROP COLUMN "_description"`);
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" DROP COLUMN "_title"`);
	}
}
