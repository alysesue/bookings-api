import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLogUserIndex1615785814022 implements MigrationInterface {
	public name = 'ChangeLogUserIndex1615785814022';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE INDEX "IDX_488976e66147a39155c77595f3" ON "booking_change_log" ("_userId") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`COMMENT ON COLUMN "setting"."_data" IS NULL`);
	}
}
