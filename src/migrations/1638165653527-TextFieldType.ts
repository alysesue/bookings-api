import { MigrationInterface, QueryRunner } from 'typeorm';

export class TextFieldType1638165653527 implements MigrationInterface {
	name = 'TextFieldType1638165653527';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "dynamic_field" ADD "_inputType" character varying`);

		/* sets _inputType of existing text dynamic fields as SingleLine */
		await queryRunner.query(
			`UPDATE "dynamic_field" SET "_inputType" = 'SingleLine' where "_type" = 'TextDynamicField'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "dynamic_field" DROP COLUMN "_inputType"`);
	}
}
