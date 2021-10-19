import { MigrationInterface, QueryRunner } from 'typeorm';

export class Event1624972430588 implements MigrationInterface {
	name = 'Event1624972430588';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "event" ("_id" SERIAL NOT NULL, "_serviceId" integer NOT NULL, "_title" character varying(5000), "_description" character varying(5000), "_capacity" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_00308d0201c76616c61393a7924" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "event_label" ("event_id" integer NOT NULL, "label_id" integer NOT NULL, CONSTRAINT "PK_ff0766103779b8db0931ddcbdc5" PRIMARY KEY ("event_id", "label_id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_71f31ac9ef886bb5948c1de30e" ON "event_label" ("event_id") `);
		await queryRunner.query(`CREATE INDEX "IDX_7fd499d6df8a55e7e7f9cbd8f2" ON "event_label" ("label_id") `);
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" ADD "_eventId" integer`);
		await queryRunner.query(`CREATE INDEX "IDX_c0a3502bdee1a4efe0bacdbbd0" ON "one_off_timeslot" ("_eventId") `);
		await queryRunner.query(
			`ALTER TABLE "one_off_timeslot" ADD CONSTRAINT "FK_c0a3502bdee1a4efe0bacdbbd0a" FOREIGN KEY ("_eventId") REFERENCES "event"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "event" ADD CONSTRAINT "FK_e84669929cf82896a62b8eb0555" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "event_label" ADD CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9" FOREIGN KEY ("event_id") REFERENCES "event"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "event_label" ADD CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21" FOREIGN KEY ("label_id") REFERENCES "label"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21"`);
		await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9"`);
		await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_e84669929cf82896a62b8eb0555"`);
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" DROP CONSTRAINT "FK_c0a3502bdee1a4efe0bacdbbd0a"`);
		await queryRunner.query(`DROP INDEX "IDX_c0a3502bdee1a4efe0bacdbbd0"`);
		await queryRunner.query(`ALTER TABLE "one_off_timeslot" DROP COLUMN "_eventId"`);
		await queryRunner.query(`DROP INDEX "IDX_7fd499d6df8a55e7e7f9cbd8f2"`);
		await queryRunner.query(`DROP INDEX "IDX_71f31ac9ef886bb5948c1de30e"`);
		await queryRunner.query(`DROP TABLE "event_label"`);
		await queryRunner.query(`DROP INDEX "IDX_43d570e4a1259f786de3707591"`);
		await queryRunner.query(`DROP INDEX "IDX_986f17df269b0e69f5b9525a88"`);
		await queryRunner.query(`DROP INDEX "IDX_ec4576dc8cd33409051c4af3ba"`);
		await queryRunner.query(`DROP TABLE "event"`);
	}
}
