import { MigrationInterface, QueryRunner } from 'typeorm';

export class IsSpAutoAssigned1616719301709 implements MigrationInterface {
	public name = 'isSpAutoAssigned1616719301709';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_isSpAutoAssigned" boolean NOT NULL DEFAULT false`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_isSpAutoAssigned"`);
	}
}
