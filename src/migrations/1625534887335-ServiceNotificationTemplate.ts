import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceNotificationTemplate1625534887335 implements MigrationInterface {
	name = 'ServiceNotificationTemplate1625534887335';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "service_notification_template" ("_id" SERIAL NOT NULL, "_emailTemplateType" integer NOT NULL, "_htmlTemplate" character varying NOT NULL, "_serviceId" integer NOT NULL, CONSTRAINT "PK_d517f1f9db8fc28c7e620c5421e" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_af9f88345761ed848decfb3e0e" ON "service_notification_template" ("_serviceId") `,
		);
		await queryRunner.query(
			`ALTER TABLE "service_notification_template" ADD CONSTRAINT "FK_af9f88345761ed848decfb3e0ea" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "service_notification_template" DROP CONSTRAINT "FK_af9f88345761ed848decfb3e0ea"`,
		);
		await queryRunner.query(`DROP INDEX "IDX_af9f88345761ed848decfb3e0e"`);
		await queryRunner.query(`DROP TABLE "service_notification_template"`);
	}
}
