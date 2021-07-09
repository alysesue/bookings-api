import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReasonToReject1624412487509 implements MigrationInterface {
	name = 'ReasonToReject1624412487509';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" ADD "_reasonToReject" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_reasonToReject"`);
	}
}
