import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrgServiceProviderLabels1631674237169 implements MigrationInterface {
	name = 'OrgServiceProviderLabels1631674237169';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "service_provider_label" ("_id" SERIAL NOT NULL, "_labelText" character varying(500) NOT NULL, "_categoryId" integer, "_organisationId" integer, CONSTRAINT "PK_25fe087174a073e22ea6d885b68" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "ServiceProviderLabel" ON "service_provider_label" ("_labelText", "_organisationId", "_categoryId") `,
		);
		await queryRunner.query(
			`CREATE TABLE "service_provider_label_category" ("_id" SERIAL NOT NULL, "_name" character varying(500) NOT NULL, "_organisationId" integer NOT NULL, CONSTRAINT "PK_cc145e72ea439946076db1c3849" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "ServiceProviderCategories" ON "service_provider_label_category" ("_name", "_organisationId") `,
		);
		await queryRunner.query(
			`CREATE TABLE "serviceprovider_label" ("serviceProvider_id" integer NOT NULL, "label_id" integer NOT NULL, CONSTRAINT "PK_f438e46e4235f1f9f0a8b051cc9" PRIMARY KEY ("serviceProvider_id", "label_id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_bcde96a1ffeb0937c61e8bbc69" ON "serviceprovider_label" ("serviceProvider_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_e7feecead79f3b044aa5fbc9ad" ON "serviceprovider_label" ("label_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider_label" ADD CONSTRAINT "FK_e8d112a3b917bfed377c3cdf732" FOREIGN KEY ("_organisationId") REFERENCES "organisation"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider_label" ADD CONSTRAINT "FK_d096c0b44ecb9191df82ab2d53b" FOREIGN KEY ("_categoryId") REFERENCES "service_provider_label_category"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider_label_category" ADD CONSTRAINT "FK_6d38f1dca8494060e93df0d9906" FOREIGN KEY ("_organisationId") REFERENCES "organisation"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada" FOREIGN KEY ("label_id") REFERENCES "service_provider_label"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada"`);
		await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d"`);
		await queryRunner.query(
			`ALTER TABLE "service_provider_label_category" DROP CONSTRAINT "FK_6d38f1dca8494060e93df0d9906"`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider_label" DROP CONSTRAINT "FK_d096c0b44ecb9191df82ab2d53b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider_label" DROP CONSTRAINT "FK_e8d112a3b917bfed377c3cdf732"`,
		);
		await queryRunner.query(`DROP INDEX "IDX_e7feecead79f3b044aa5fbc9ad"`);
		await queryRunner.query(`DROP INDEX "IDX_bcde96a1ffeb0937c61e8bbc69"`);
		await queryRunner.query(`DROP TABLE "serviceprovider_label"`);
		await queryRunner.query(`DROP INDEX "ServiceProviderCategories"`);
		await queryRunner.query(`DROP TABLE "service_provider_label_category"`);
		await queryRunner.query(`DROP INDEX "ServiceProviderLabel"`);
		await queryRunner.query(`DROP TABLE "service_provider_label"`);
	}
}
