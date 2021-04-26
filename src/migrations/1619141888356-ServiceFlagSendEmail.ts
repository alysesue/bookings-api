import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceFlagSendEmail1619141888356 implements MigrationInterface {
	public name = 'ServiceFlagSendEmail1619141888356';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_sendNotifications" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(
			`ALTER TABLE "service" ADD "_sendNotificationsToServiceProviders" boolean NOT NULL DEFAULT false`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_sendNotificationsToServiceProviders"`);
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_sendNotifications"`);
	}
}
