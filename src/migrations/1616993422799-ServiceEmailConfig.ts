import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceEmailConfig1616993422799 implements MigrationInterface {
	public name = 'ServiceEmailConfig1616993422799';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "service" ADD "_sendNotificationsToServiceProviders" boolean NOT NULL DEFAULT false`,
		);
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
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_sendNotificationsToServiceProviders"`);
	}
}
