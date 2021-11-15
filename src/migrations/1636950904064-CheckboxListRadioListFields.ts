import { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckboxListRadioListFields1636950904064 implements MigrationInterface {
	name = 'CheckboxListRadioListFields1636950904064';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "dynamic_field" ALTER COLUMN "_options" SET NOT NULL`);
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
			`CREATE TYPE "public"."dynamic_field__type_enum_old" AS ENUM('SelectListDynamicField', 'TextDynamicField', 'DateOnlyDynamicField', 'MyInfoDynamicFieldType')`,
		);
		await queryRunner.query(
			`ALTER TABLE "dynamic_field" ALTER COLUMN "_type" TYPE "public"."dynamic_field__type_enum_old" USING "_type"::"text"::"public"."dynamic_field__type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."dynamic_field__type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."dynamic_field__type_enum_old" RENAME TO "dynamic_field__type_enum"`,
		);
		await queryRunner.query(`ALTER TABLE "dynamic_field" ALTER COLUMN "_options" DROP NOT NULL`);
	}
}
