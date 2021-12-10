import {MigrationInterface, QueryRunner} from "typeorm";

export class MapServicesAndOrganisationsToAdmin1639023609720 implements MigrationInterface {
    name = 'MapServicesAndOrganisationsToAdmin1639023609720'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "service_admin_service_map" ("adminUser_id" integer NOT NULL, "service_id" integer NOT NULL, CONSTRAINT "PK_3629450ac143db3c34eca65f578" PRIMARY KEY ("adminUser_id", "service_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c0aca0ec11a42ba2bb17852a93" ON "service_admin_service_map" ("adminUser_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a8c51002a3222ca28e8c998413" ON "service_admin_service_map" ("service_id") `);
        await queryRunner.query(`CREATE TABLE "organisation_admin_organisation_map" ("adminUser_id" integer NOT NULL, "organisation_id" integer NOT NULL, CONSTRAINT "PK_e74f37deb44603113d2d75154d2" PRIMARY KEY ("adminUser_id", "organisation_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_93596df3a4cd9b0d3f9e8ecaf5" ON "organisation_admin_organisation_map" ("adminUser_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_42ac78f3769c45b6fd82911fe3" ON "organisation_admin_organisation_map" ("organisation_id") `);
        await queryRunner.query(`ALTER TABLE "service_admin_service_map" ADD CONSTRAINT "FK_c0aca0ec11a42ba2bb17852a933" FOREIGN KEY ("adminUser_id") REFERENCES "admin_user"("_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "service_admin_service_map" ADD CONSTRAINT "FK_a8c51002a3222ca28e8c998413f" FOREIGN KEY ("service_id") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organisation_admin_organisation_map" ADD CONSTRAINT "FK_93596df3a4cd9b0d3f9e8ecaf53" FOREIGN KEY ("adminUser_id") REFERENCES "admin_user"("_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "organisation_admin_organisation_map" ADD CONSTRAINT "FK_42ac78f3769c45b6fd82911fe3a" FOREIGN KEY ("organisation_id") REFERENCES "organisation"("_id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organisation_admin_organisation_map" DROP CONSTRAINT "FK_42ac78f3769c45b6fd82911fe3a"`);
        await queryRunner.query(`ALTER TABLE "organisation_admin_organisation_map" DROP CONSTRAINT "FK_93596df3a4cd9b0d3f9e8ecaf53"`);
        await queryRunner.query(`ALTER TABLE "service_admin_service_map" DROP CONSTRAINT "FK_a8c51002a3222ca28e8c998413f"`);
        await queryRunner.query(`ALTER TABLE "service_admin_service_map" DROP CONSTRAINT "FK_c0aca0ec11a42ba2bb17852a933"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_42ac78f3769c45b6fd82911fe3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_93596df3a4cd9b0d3f9e8ecaf5"`);
        await queryRunner.query(`DROP TABLE "organisation_admin_organisation_map"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a8c51002a3222ca28e8c998413"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0aca0ec11a42ba2bb17852a93"`);
        await queryRunner.query(`DROP TABLE "service_admin_service_map"`);
    }

}
