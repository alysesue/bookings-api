import { MigrationInterface, QueryRunner } from 'typeorm';

export class VideoConferenceUrl1615172013022 implements MigrationInterface {
	public name = 'VideoConferenceUrl1615172013022';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" ADD "_videoConferenceUrl" character varying`);
		await queryRunner.query(`COMMENT ON COLUMN "setting"."_data" IS NULL`);
		await queryRunner.query(
			`ALTER TABLE "setting" ALTER COLUMN "_data" SET DEFAULT '{"redirectionWhitelistedUrl":[]}'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "setting" ALTER COLUMN "_data" SET DEFAULT '{"redirectionWhitelistedUrl": []}'`,
		);
		await queryRunner.query(`COMMENT ON COLUMN "setting"."_data" IS NULL`);
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_videoConferenceUrl"`);
	}
}
