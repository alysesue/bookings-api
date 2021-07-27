import { MigrationInterface, QueryRunner } from 'typeorm';

export class OtpTable1626098005671 implements MigrationInterface {
	name = 'OtpTable1626098005671';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "otp" ("_id" SERIAL NOT NULL, "_requestId" character varying NOT NULL, "_mobileNo" character varying NOT NULL, "_value" character varying NOT NULL, "_createdAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_05b19d9bee3daf273c978d6896e" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3d43b7c9d1bedbeec32692da5b" ON "otp" ("_requestId") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_3d43b7c9d1bedbeec32692da5b"`);
		await queryRunner.query(`DROP TABLE "otp"`);
	}
}
