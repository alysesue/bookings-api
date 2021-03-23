import { MigrationInterface, QueryRunner } from 'typeorm';

export class Label1616397192886 implements MigrationInterface {
	public name = 'Label1616397192886';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "label" ("_id" SERIAL NOT NULL, "_labelText" character varying NOT NULL, "_serviceId" integer, CONSTRAINT "PK_074a1fd1507efd236f0c1995f62" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "label" ADD CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f"`);
		await queryRunner.query(`DROP TABLE "label"`);
	}
}
