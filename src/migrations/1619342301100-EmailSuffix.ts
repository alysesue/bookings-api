import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmailSuffix1619342301100 implements MigrationInterface {
	public name = 'EmailSuffix1619342301100';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_emailSuffix" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_emailSuffix"`);
	}
}
