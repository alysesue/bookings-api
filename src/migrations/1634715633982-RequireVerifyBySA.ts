import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequireVerifyBySA1634715633982 implements MigrationInterface {
	name = 'RequireVerifyBySA1634715633982';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_requireVerifyBySA" boolean NOT NULL DEFAULT false`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_requireVerifyBySA"`);
	}
}
