import { MigrationInterface, QueryRunner } from 'typeorm';

export class SalutationField1636342375459 implements MigrationInterface {
	name = 'SalutationField1636342375459';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_hasSalutation" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`ALTER TABLE "booking" ADD "_citizenSalutation" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_citizenSalutation"`);
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_hasSalutation"`);
	}
}
