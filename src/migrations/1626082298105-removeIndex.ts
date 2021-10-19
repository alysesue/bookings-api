import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeIndex1626082298105 implements MigrationInterface {
	name = 'removeIndex1626082298105';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_c0a3502bdee1a4efe0bacdbbd0"`);
		await queryRunner.query(`ALTER TABLE "event" ADD "_isOneOffTimeslot" boolean NOT NULL DEFAULT true`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "_isOneOffTimeslot"`);
		await queryRunner.query(`CREATE INDEX "IDX_c0a3502bdee1a4efe0bacdbbd0" ON "one_off_timeslot" ("_eventId") `);
	}
}
