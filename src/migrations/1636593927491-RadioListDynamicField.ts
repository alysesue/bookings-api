import { MigrationInterface, QueryRunner } from 'typeorm';

export class RadioListDynamicField1636593927491 implements MigrationInterface {
	name = 'RadioListDynamicField1636593927491';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."dynamic_field__type_enum" RENAME TO "dynamic_field__type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."dynamic_field__type_enum" AS ENUM('SelectListDynamicField', 'TextDynamicField', 'DateOnlyDynamicField', 'MyInfoDynamicFieldType', 'CheckboxListDynamicField', 'RadioListDynamicField')`,
		);
		await queryRunner.query(
			`ALTER TABLE "dynamic_field" ALTER COLUMN "_type" TYPE "public"."dynamic_field__type_enum" USING "_type"::"text"::"public"."dynamic_field__type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."dynamic_field__type_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."dynamic_field__type_enum_old" AS ENUM('SelectListDynamicField', 'TextDynamicField', 'DateOnlyDynamicField', 'MyInfoDynamicFieldType', 'CheckboxListDynamicField')`,
		);
		await queryRunner.query(
			`ALTER TABLE "dynamic_field" ALTER COLUMN "_type" TYPE "public"."dynamic_field__type_enum_old" USING "_type"::"text"::"public"."dynamic_field__type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."dynamic_field__type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."dynamic_field__type_enum_old" RENAME TO "dynamic_field__type_enum"`,
		);
	}
}
