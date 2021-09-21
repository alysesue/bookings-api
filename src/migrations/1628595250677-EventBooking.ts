import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventBooking1628595250677 implements MigrationInterface {
	name = 'EventBooking1628595250677';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "booked_slot" ("_id" SERIAL NOT NULL, "_startDateTime" TIMESTAMP NOT NULL, "_endDateTime" TIMESTAMP NOT NULL, "_bookingId" integer NOT NULL, "_serviceProviderId" integer, CONSTRAINT "PK_9eb596560eab5769ddbd6480259" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_0ff47cbef238b677049fbe25f9" ON "booked_slot" ("_startDateTime") `);
		await queryRunner.query(`CREATE INDEX "IDX_218fcc20e6872ee1331cedb2cb" ON "booked_slot" ("_endDateTime") `);
		await queryRunner.query(`CREATE INDEX "IDX_e02db22d951eee4ae38312a6e8" ON "booked_slot" ("_bookingId") `);
		await queryRunner.query(
			`CREATE INDEX "IDX_0a24f74a667542687ad92198b2" ON "booked_slot" ("_serviceProviderId") `,
		);
		await queryRunner.query(`ALTER TABLE "booking" ADD "_eventId" integer`);
		await queryRunner.query(`CREATE INDEX "IDX_b6116027e46ee10f2f091e7405" ON "booking" ("_eventId") `);
		await queryRunner.query(
			`ALTER TABLE "booked_slot" ADD CONSTRAINT "FK_e02db22d951eee4ae38312a6e8f" FOREIGN KEY ("_bookingId") REFERENCES "booking"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "booked_slot" ADD CONSTRAINT "FK_0a24f74a667542687ad92198b24" FOREIGN KEY ("_serviceProviderId") REFERENCES "service_provider"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "booking" ADD CONSTRAINT "FK_b6116027e46ee10f2f091e7405e" FOREIGN KEY ("_eventId") REFERENCES "event"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_b6116027e46ee10f2f091e7405e"`);
		await queryRunner.query(`ALTER TABLE "booked_slot" DROP CONSTRAINT "FK_0a24f74a667542687ad92198b24"`);
		await queryRunner.query(`ALTER TABLE "booked_slot" DROP CONSTRAINT "FK_e02db22d951eee4ae38312a6e8f"`);
		await queryRunner.query(`DROP INDEX "IDX_b6116027e46ee10f2f091e7405"`);
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_eventId"`);
		await queryRunner.query(`DROP INDEX "IDX_0a24f74a667542687ad92198b2"`);
		await queryRunner.query(`DROP INDEX "IDX_e02db22d951eee4ae38312a6e8"`);
		await queryRunner.query(`DROP INDEX "IDX_218fcc20e6872ee1331cedb2cb"`);
		await queryRunner.query(`DROP INDEX "IDX_0ff47cbef238b677049fbe25f9"`);
		await queryRunner.query(`DROP TABLE "booked_slot"`);
	}
}
