import { MigrationInterface, QueryRunner } from 'typeorm';

export class DynamicValues1617260385656 implements MigrationInterface {
	public name = 'DynamicValues1617260385656';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" ADD "_dynamicValues" jsonb NOT NULL DEFAULT '[]'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_dynamicValues"`);
	}
}
