import { MigrationInterface, QueryRunner } from 'typeorm';

export class OnHoldReschedule1632718251210 implements MigrationInterface {
	name = 'OnHoldReschedule1632718251210';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE "booking_workflow__type_enum" AS ENUM('onHoldReschedule')`);
		await queryRunner.query(
			`CREATE TABLE "booking_workflow" ("_id" SERIAL NOT NULL, "_targetId" integer NOT NULL, "_onHoldRescheduleId" integer NOT NULL, "_type" "booking_workflow__type_enum" NOT NULL, CONSTRAINT "REL_4c2affb4d5a72e600b2ed4935c" UNIQUE ("_onHoldRescheduleId"), CONSTRAINT "PK_2a8d7b2daf318877519717d4293" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_2b50dea2597080a12c0e27610c" ON "booking_workflow" ("_targetId") `);
		await queryRunner.query(
			`CREATE INDEX "IDX_4c2affb4d5a72e600b2ed4935c" ON "booking_workflow" ("_onHoldRescheduleId") `,
		);
		await queryRunner.query(
			`ALTER TABLE "booking_workflow" ADD CONSTRAINT "FK_2b50dea2597080a12c0e27610c6" FOREIGN KEY ("_targetId") REFERENCES "booking"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "booking_workflow" ADD CONSTRAINT "FK_4c2affb4d5a72e600b2ed4935cf" FOREIGN KEY ("_onHoldRescheduleId") REFERENCES "booking"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking_workflow" DROP CONSTRAINT "FK_4c2affb4d5a72e600b2ed4935cf"`);
		await queryRunner.query(`ALTER TABLE "booking_workflow" DROP CONSTRAINT "FK_2b50dea2597080a12c0e27610c6"`);
		await queryRunner.query(`DROP INDEX "IDX_4c2affb4d5a72e600b2ed4935c"`);
		await queryRunner.query(`DROP INDEX "IDX_2b50dea2597080a12c0e27610c"`);
		await queryRunner.query(`DROP TABLE "booking_workflow"`);
		await queryRunner.query(`DROP TYPE "booking_workflow__type_enum"`);
	}
}
