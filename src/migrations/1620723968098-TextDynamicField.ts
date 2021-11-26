import { MigrationInterface, QueryRunner } from 'typeorm';

export class TextDynamicField1620723968098 implements MigrationInterface {
	name = 'TextDynamicField1620723968098';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_8b351798cf615725ad850c7865"`);
		await queryRunner.query(`ALTER TABLE "dynamic_field" DROP COLUMN "type"`);
		await queryRunner.query(
			`CREATE TYPE "dynamic_field__type_enum" AS ENUM('SelectListDynamicField', 'TextDynamicField')`,
		);
		await queryRunner.query(`ALTER TABLE "dynamic_field" ADD "_type" "dynamic_field__type_enum" NULL`);
		await queryRunner.query(`ALTER TABLE "dynamic_field" ADD "_charLimit" integer DEFAULT '0'`);
		await queryRunner.query(`ALTER TABLE "dynamic_field" ADD "_inputType" character varying`);

		/* sets existing dynamic fields to SelectListDynamicField */
		await queryRunner.query(`UPDATE "dynamic_field" SET "_type" = 'SelectListDynamicField'`);
		await queryRunner.query(`ALTER TABLE "dynamic_field" ALTER COLUMN "_type" SET NOT NULL`);

		await queryRunner.query(`CREATE INDEX "IDX_2302a017e9de2bfd3ba4f989fd" ON "dynamic_field" ("_type") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_2302a017e9de2bfd3ba4f989fd"`);
		await queryRunner.query(`ALTER TABLE "dynamic_field" DROP COLUMN "_charLimit"`);
		await queryRunner.query(`ALTER TABLE "dynamic_field" DROP COLUMN "_inputType"`);
		await queryRunner.query(`ALTER TABLE "dynamic_field" DROP COLUMN "_type"`);
		await queryRunner.query(`DROP TYPE "dynamic_field__type_enum"`);
		await queryRunner.query(`ALTER TABLE "dynamic_field" ADD "type" character varying NOT NULL`);
		await queryRunner.query(`CREATE INDEX "IDX_8b351798cf615725ad850c7865" ON "dynamic_field" ("type") `);
	}
}
