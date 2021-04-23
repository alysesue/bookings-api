import { MigrationInterface, QueryRunner } from 'typeorm';

export class DynamicFields1617079139135 implements MigrationInterface {
	public name = 'DynamicFields1617079139135';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "dynamic_field" ("_id" SERIAL NOT NULL, "_serviceId" integer NOT NULL, "_name" character varying NOT NULL, "_options" jsonb DEFAULT '[]', "type" character varying NOT NULL, CONSTRAINT "PK_7de734572d72d4b90691db2da13" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_f6a1fff8df7c8f91845f79ba82" ON "dynamic_field" ("_serviceId") `);
		await queryRunner.query(`CREATE INDEX "IDX_8b351798cf615725ad850c7865" ON "dynamic_field" ("type") `);
		await queryRunner.query(
			`ALTER TABLE "dynamic_field" ADD CONSTRAINT "FK_f6a1fff8df7c8f91845f79ba825" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "dynamic_field" DROP CONSTRAINT "FK_f6a1fff8df7c8f91845f79ba825"`);
		await queryRunner.query(`DROP INDEX "IDX_8b351798cf615725ad850c7865"`);
		await queryRunner.query(`DROP INDEX "IDX_f6a1fff8df7c8f91845f79ba82"`);
		await queryRunner.query(`DROP TABLE "dynamic_field"`);
	}
}
