import { MigrationInterface, QueryRunner } from 'typeorm';

export class DateOnlyDynamicField1634081882047 implements MigrationInterface {
	name = 'DateOnlyDynamicField1634081882047';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TYPE "dynamic_field__type_enum" RENAME TO "dynamic_field__type_enum_old"`);
		await queryRunner.query(
			`CREATE TYPE "dynamic_field__type_enum" AS ENUM('SelectListDynamicField', 'TextDynamicField', 'DateOnlyDynamicField', 'MyInfoDynamicFieldType')`,
		);
		await queryRunner.query(
			`ALTER TABLE "dynamic_field" ALTER COLUMN "_type" TYPE "dynamic_field__type_enum" USING "_type"::"text"::"dynamic_field__type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "dynamic_field__type_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "dynamic_field__type_enum_old" AS ENUM('SelectListDynamicField', 'TextDynamicField', 'MyInfoDynamicFieldType')`,
		);
		await queryRunner.query(
			`ALTER TABLE "dynamic_field" ALTER COLUMN "_type" TYPE "dynamic_field__type_enum_old" USING "_type"::"text"::"dynamic_field__type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "dynamic_field__type_enum"`);
		await queryRunner.query(`ALTER TYPE "dynamic_field__type_enum_old" RENAME TO "dynamic_field__type_enum"`);
	}
}
