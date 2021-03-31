import { MigrationInterface, QueryRunner } from 'typeorm';

export class OneOffTimeslotsAndLabel1617167862646 implements MigrationInterface {
	public name = 'OneOffTimeslotsAndLabel1617167862646';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "label" ADD "_oneOffTimeslotId" integer`);
		await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f"`);
		await queryRunner.query(`ALTER TABLE "label" ALTER COLUMN "_serviceId" SET NOT NULL`);
		await queryRunner.query(`COMMENT ON COLUMN "label"."_serviceId" IS NULL`);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_44b3185ec745b6f7cb4a114396" ON "label" ("_serviceId", "_labelText") `,
		);
		await queryRunner.query(
			`ALTER TABLE "label" ADD CONSTRAINT "ServiceLabels" UNIQUE ("_labelText", "_serviceId")`,
		);
		await queryRunner.query(
			`ALTER TABLE "label" ADD CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "label" ADD CONSTRAINT "FK_5c2d312ef3baba8f7c29c418441" FOREIGN KEY ("_oneOffTimeslotId") REFERENCES "one_off_timeslot"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "FK_5c2d312ef3baba8f7c29c418441"`);
		await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f"`);
		await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "ServiceLabels"`);
		await queryRunner.query(`DROP INDEX "IDX_44b3185ec745b6f7cb4a114396"`);
		await queryRunner.query(`COMMENT ON COLUMN "label"."_serviceId" IS NULL`);
		await queryRunner.query(`ALTER TABLE "label" ALTER COLUMN "_serviceId" DROP NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "label" ADD CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(`ALTER TABLE "label" DROP COLUMN "_oneOffTimeslotId"`);
	}
}
