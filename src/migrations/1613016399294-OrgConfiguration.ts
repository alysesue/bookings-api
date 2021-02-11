import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrgConfiguration1613016399294 implements MigrationInterface {
	public name = 'OrgConfiguration1613016399294';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "organisation" ADD "_configuration" jsonb`);
		// Initial value for configuration: {}
		await queryRunner.query(`UPDATE "organisation" set "_configuration" = '{}' where "_configuration" IS NULL`);

		await queryRunner.query(`ALTER TABLE "organisation" ALTER COLUMN "_configuration" SET NOT NULL`);
		await queryRunner.query(`COMMENT ON COLUMN "organisation"."_configuration" IS NULL`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "organisation" DROP COLUMN "_configuration"`);
	}
}
