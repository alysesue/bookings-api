import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettings1613519460931 implements MigrationInterface {
	public name = 'addSettings1613519460931';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_ecef1b662f498ee08a8671463f"`);
		await queryRunner.query(
			`CREATE INDEX "IDX_ecef1b662f498ee08a8671463f" ON "service_provider" ("_serviceId", "_name") `,
		);
		await queryRunner.query(`INSERT INTO "setting" ("data") VALUES ('{"redirectionWhitelistedUrl": []}')`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_ecef1b662f498ee08a8671463f"`);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_ecef1b662f498ee08a8671463f" ON "service_provider" ("_serviceId", "_name") `,
		);
	}
}
