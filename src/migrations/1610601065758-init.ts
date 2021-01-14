import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1610601065758 implements MigrationInterface {
	public name = 'init1610601065758';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`select now();`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`select now();`);
	}
}
