import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmailSuffix1619458019731 implements MigrationInterface {
	public name = 'EmailSuffix1619458019731';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_emailSuffix" character varying(100)`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_emailSuffix"`);
	}
}
