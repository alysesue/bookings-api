import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrgConfiguration1613085942023 implements MigrationInterface {
	public name = 'OrgConfiguration1613085942023';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "organisation" ADD "_configuration" jsonb NOT NULL DEFAULT '{}'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "organisation" DROP COLUMN "_configuration"`);
	}
}
