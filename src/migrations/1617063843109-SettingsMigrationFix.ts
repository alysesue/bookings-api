import { MigrationInterface, QueryRunner } from 'typeorm';

export class SettingsMigrationFix1617063843109 implements MigrationInterface {
	public name = 'SettingsMigrationFix1617063843109';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`COMMENT ON COLUMN "setting"."_data" IS 'Setting data'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`COMMENT ON COLUMN "setting"."_data" IS NULL`);
	}
}
