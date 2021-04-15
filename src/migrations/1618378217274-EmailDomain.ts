import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmailDomain1618378217274 implements MigrationInterface {
	public name = 'EmailDomain1618378217274';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_emailDomain" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_emailDomain"`);
	}
}
