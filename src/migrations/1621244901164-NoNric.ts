import { MigrationInterface, QueryRunner } from 'typeorm';

export class NoNric1621244901164 implements MigrationInterface {
	name = 'NoNric1621244901164';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_noNric" boolean NOT NULL DEFAULT false`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_noNric"`);
	}
}
