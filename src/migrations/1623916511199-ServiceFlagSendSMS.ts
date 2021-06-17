import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceFlagSendSMS1623916511199 implements MigrationInterface {
	name = 'ServiceFlagSendSMS1623916511199';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_sendSMSNotifications" boolean NOT NULL DEFAULT false`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_sendSMSNotifications"`);
	}
}
