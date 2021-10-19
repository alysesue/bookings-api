import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSomeOneOffTimeslotsPropreties1625486711046 implements MigrationInterface {
	name = 'RemoveSomeOneOffTimeslotsPropreties1625486711046';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" DROP COLUMN "_capacity"`);
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" DROP COLUMN "_title"`);
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" DROP COLUMN "_description"`);
		await queryRunner.query(`DROP TABLE IF EXISTS oneofftimeslot_label`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" ADD "_description" character varying(5000)`);
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" ADD "_title" character varying(5000)`);
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" ADD "_capacity" integer NOT NULL DEFAULT '1'`);
	}
}
