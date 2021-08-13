import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomUpdateAllExistingDynamicFields1628820298859 implements MigrationInterface {
	name = 'CustomUpdateAllExistingDynamicFields1628820298859';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`UPDATE "dynamic_field" SET "_isMandatory" = true WHERE "_id" >= 1`);
	}

	public async down(_queryRunner: QueryRunner): Promise<void> {}
}
