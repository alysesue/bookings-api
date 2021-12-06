import {MigrationInterface, QueryRunner} from "typeorm";

export class ServiceBookingLimitation1638772496515 implements MigrationInterface {
    name = 'ServiceBookingLimitation1638772496515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "service_setting" ("_id" SERIAL NOT NULL, "_bookingLimitation" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_216bb4361584336831d9be23de8" PRIMARY KEY ("_id"))`);
        await queryRunner.query(`ALTER TABLE "service" ADD "_serviceSettingId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service" ADD CONSTRAINT "UQ_7ee2973e304fc114674982119e6" UNIQUE ("_serviceSettingId")`);
        await queryRunner.query(`ALTER TABLE "service" ADD CONSTRAINT "FK_7ee2973e304fc114674982119e6" FOREIGN KEY ("_serviceSettingId") REFERENCES "service_setting"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "FK_7ee2973e304fc114674982119e6"`);
        await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "UQ_7ee2973e304fc114674982119e6"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_serviceSettingId"`);
        await queryRunner.query(`DROP TABLE "service_setting"`);
    }

}
