import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettings1613952097476 implements MigrationInterface {
	public name = 'AddSettings1613952097476';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "setting" ("_id" SERIAL NOT NULL, "_data" jsonb NOT NULL DEFAULT '{"redirectionWhitelistedUrl":[]}', CONSTRAINT "PK_7389d834cf0735f903259668192" PRIMARY KEY ("_id"))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "setting"`);
	}
}
