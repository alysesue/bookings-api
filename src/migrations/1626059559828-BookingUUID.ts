import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingUUID1626059559828 implements MigrationInterface {
	name = 'BookingUUID1626059559828';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "anonymous_user" ADD "_bookingUUID" uuid`);
		await queryRunner.query(`ALTER TABLE "booking" ADD "_uuid" uuid NOT NULL DEFAULT uuid_generate_v4()`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ecc991d01d12e6ea6050860b70" ON "booking" ("_uuid") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_ecc991d01d12e6ea6050860b70"`);
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_uuid"`);
		await queryRunner.query(`ALTER TABLE "anonymous_user" DROP COLUMN "_bookingUUID"`);
	}
}
