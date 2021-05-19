import {MigrationInterface, QueryRunner} from "typeorm";

export class Category1621317148775 implements MigrationInterface {
    name = 'Category1621317148775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "ServiceLabels"`);
        await queryRunner.query(`CREATE TABLE "category" ("_id" SERIAL NOT NULL, "_categoryName" character varying(500) NOT NULL, "_serviceId" integer NOT NULL, CONSTRAINT "PK_0d6721292a14c4041a79fb021fb" PRIMARY KEY ("_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ServiceCategories" ON "category" ("_categoryName", "_serviceId") `);
        await queryRunner.query(`ALTER TABLE "label" ADD "_categoryId" integer`);
        await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f"`);
        await queryRunner.query(`ALTER TABLE "label" ALTER COLUMN "_serviceId" DROP NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "LabelsCategoriesService" ON "label" ("_labelText", "_serviceId", "_categoryId") `);
        await queryRunner.query(`ALTER TABLE "label" ADD CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "label" ADD CONSTRAINT "FK_951fda8ace32a9a31ceae08c668" FOREIGN KEY ("_categoryId") REFERENCES "category"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "FK_92c642f9262d87d083041a69f75" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_92c642f9262d87d083041a69f75"`);
        await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "FK_951fda8ace32a9a31ceae08c668"`);
        await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f"`);
        await queryRunner.query(`DROP INDEX "LabelsCategoriesService"`);
        await queryRunner.query(`ALTER TABLE "label" ALTER COLUMN "_serviceId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "label" ADD CONSTRAINT "FK_cc1f8c3a61d2020a8de31f0fd1f" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "label" DROP COLUMN "_categoryId"`);
        await queryRunner.query(`DROP INDEX "ServiceCategories"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`ALTER TABLE "label" ADD CONSTRAINT "ServiceLabels" UNIQUE ("_labelText", "_serviceId")`);
    }

}
