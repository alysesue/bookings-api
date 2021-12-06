// import { MigrationInterface, QueryRunner } from 'typeorm';

// export class ServiceSettingsBookingLimitation1637888023055 implements MigrationInterface {
// 	name = 'ServiceSettingsBookingLimitation1637888023055';

// 	public async up(queryRunner: QueryRunner): Promise<void> {
// 		await queryRunner.query(
// 			`CREATE TABLE "service_setting" ("_id" SERIAL NOT NULL, "_bookingLimitationType" character varying NOT NULL DEFAULT 'NoLimitations', "_bookingLimitationNumber" integer, CONSTRAINT "PK_216bb4361584336831d9be23de8" PRIMARY KEY ("_id"))`,
// 		);

// 		await queryRunner.query(`ALTER TABLE "service" ADD "_serviceSettingId" integer null`);

// 		await queryRunner.query(
// 			`ALTER TABLE "service" ADD CONSTRAINT "UQ_7ee2973e304fc114674982119e6" UNIQUE ("_serviceSettingId")`,
// 		);
// 		await queryRunner.query(
// 			`ALTER TABLE "service" ADD CONSTRAINT "FK_7ee2973e304fc114674982119e6" FOREIGN KEY ("_serviceSettingId") REFERENCES "service_setting"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
// 		);
// 		await queryRunner.query(`
// 			do $$
// 				DECLARE
// 					t_row record;
// 					last_id integer;
// 				BEGIN
// 					FOR t_row in SELECT * FROM service LOOP
// 						INSERT INTO "service_setting" DEFAULT VALUES returning _id INTO last_id;
// 					update service set "_serviceSettingId" = (last_id) where _id = t_row._id;
// 					END LOOP;
// 			END;
// 			$$;`);

// 		await queryRunner.query(`ALTER TABLE "service" ALTER "_serviceSettingId" SET NOT NULL`);
// 	}

// 	public async down(queryRunner: QueryRunner): Promise<void> {
// 		await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "FK_7ee2973e304fc114674982119e6"`);
// 		await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "UQ_7ee2973e304fc114674982119e6"`);
// 		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_serviceSettingId"`);
// 		await queryRunner.query(`DROP TABLE "service_setting"`);
// 	}
// }
