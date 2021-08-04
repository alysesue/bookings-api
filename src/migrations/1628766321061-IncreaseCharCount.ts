import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreaseCharCount1628766321061 implements MigrationInterface {
	name = 'IncreaseCharCount1628766321061';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "_name" TYPE varchar(500)`);
		await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "_description" TYPE varchar(500)`);
		await queryRunner.query(`ALTER TABLE "service_provider" ALTER COLUMN "_name" TYPE varchar(500)`);
		await queryRunner.query(`ALTER TABLE "service_provider" ALTER COLUMN "_description" TYPE varchar(500)`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "_name" TYPE varchar(100)`);
		await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "_description" TYPE varchar(100)`);
		await queryRunner.query(`ALTER TABLE "service_provider" ALTER COLUMN "_name" TYPE varchar(300)`);
		await queryRunner.query(`ALTER TABLE "service_provider" ALTER COLUMN "_description" TYPE varchar(100)`);
	}
}
