import { MigrationInterface, QueryRunner } from 'typeorm';

export class IsSpAutoAssigned1616719301709 implements MigrationInterface {
	public name = 'isSpAutoAssigned1616719301709';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_488976e66147a39155c77595f3"`);
		await queryRunner.query(`ALTER TABLE "service" ADD "_isSpAutoAssigned" boolean NOT NULL DEFAULT false`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_isSpAutoAssigned"`);
		await queryRunner.query(`CREATE INDEX "IDX_488976e66147a39155c77595f3" ON "booking_change_log" ("_userId") `);
	}
}
