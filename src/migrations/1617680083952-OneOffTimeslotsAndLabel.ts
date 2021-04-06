import {MigrationInterface, QueryRunner} from 'typeorm';

export class OneOffTimeslotsAndLabel1617680083952 implements MigrationInterface {
	public name = 'OneOffTimeslotsAndLabel1617680083952';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TABLE "oneofftimeslot_label" ("oneOffTimeslot_id" integer NOT NULL, "label_id" integer NOT NULL, CONSTRAINT "PK_0856c5b9114aae889e29709659f" PRIMARY KEY ("oneOffTimeslot_id", "label_id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_440588b2ba9eae99f4376b044b" ON "oneofftimeslot_label" ("oneOffTimeslot_id") `);
		await queryRunner.query(`CREATE INDEX "IDX_d3d3b85984070dcde0f9dbf007" ON "oneofftimeslot_label" ("label_id") `);
		await queryRunner.query(`ALTER TABLE "oneofftimeslot_label" ADD CONSTRAINT "FK_440588b2ba9eae99f4376b044bf" FOREIGN KEY ("oneOffTimeslot_id") REFERENCES "one_off_timeslot"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "oneofftimeslot_label" ADD CONSTRAINT "FK_d3d3b85984070dcde0f9dbf0072" FOREIGN KEY ("label_id") REFERENCES "label"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "oneofftimeslot_label" DROP CONSTRAINT "FK_d3d3b85984070dcde0f9dbf0072"`);
		await queryRunner.query(`ALTER TABLE "oneofftimeslot_label" DROP CONSTRAINT "FK_440588b2ba9eae99f4376b044bf"`);
		await queryRunner.query(`DROP INDEX "IDX_d3d3b85984070dcde0f9dbf007"`);
		await queryRunner.query(`DROP INDEX "IDX_440588b2ba9eae99f4376b044b"`);
		await queryRunner.query(`DROP TABLE "oneofftimeslot_label"`);
	}
}
