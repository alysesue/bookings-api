import { MigrationInterface, QueryRunner } from 'typeorm';

export class OneOffTimeslots1614581500291 implements MigrationInterface {
	public name = 'OneOffTimeslots1614581500291';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "one_off_timeslot" ("_id" SERIAL NOT NULL, "_startDateTime" TIMESTAMP NOT NULL, "_endDateTime" TIMESTAMP NOT NULL, "_capacity" integer NOT NULL DEFAULT '1', "_serviceProviderId" integer NOT NULL, CONSTRAINT "PK_da2eac5d5352da2b007add424ba" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_3962ae3fefce636e5b036a5ea0" ON "one_off_timeslot" ("_startDateTime") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_7687ecbce087e2ddf9ee0a02f0" ON "one_off_timeslot" ("_endDateTime") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_461fd904c25a79ad2d30dc6acb" ON "one_off_timeslot" ("_serviceProviderId") `,
		);
		await queryRunner.query(
			`ALTER TABLE "one_off_timeslot" ADD CONSTRAINT "FK_461fd904c25a79ad2d30dc6acb7" FOREIGN KEY ("_serviceProviderId") REFERENCES "service_provider"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" DROP CONSTRAINT "FK_461fd904c25a79ad2d30dc6acb7"`);
		await queryRunner.query(`DROP INDEX "IDX_461fd904c25a79ad2d30dc6acb"`);
		await queryRunner.query(`DROP INDEX "IDX_7687ecbce087e2ddf9ee0a02f0"`);
		await queryRunner.query(`DROP INDEX "IDX_3962ae3fefce636e5b036a5ea0"`);
		await queryRunner.query(`DROP TABLE "one_off_timeslot"`);
	}
}
