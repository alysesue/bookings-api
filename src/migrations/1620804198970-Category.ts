import { MigrationInterface, QueryRunner } from 'typeorm';

export class Category1620804198970 implements MigrationInterface {
	name = 'Category1620804198970';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "ServiceLabels"`);
		await queryRunner.query(
			`CREATE TABLE "category" ("_id" SERIAL NOT NULL, "_categoryName" character varying(500) NOT NULL, "_serviceId" integer NOT NULL, CONSTRAINT "ServiceCategories" UNIQUE ("_categoryName", "_serviceId"), CONSTRAINT "PK_0d6721292a14c4041a79fb021fb" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "category" ADD CONSTRAINT "FK_92c642f9262d87d083041a69f75" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_92c642f9262d87d083041a69f75"`);
		await queryRunner.query(`DROP TABLE "category"`);
		await queryRunner.query(
			`ALTER TABLE "label" ADD CONSTRAINT "ServiceLabels" UNIQUE ("_labelText", "_serviceId")`,
		);
	}
}
