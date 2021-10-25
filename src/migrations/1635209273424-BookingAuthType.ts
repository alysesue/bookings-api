import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingAuthType1635209273424 implements MigrationInterface {
	name = 'BookingAuthType1635209273424';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" ADD "_citizenAuthType" character varying`);
		await queryRunner.query(
			`ALTER TABLE "event" ALTER COLUMN "_firstStartDateTime" SET DEFAULT '"2020-01-01T14:00:00.000Z"'`,
		);
		await queryRunner.query(
			`ALTER TABLE "event" ALTER COLUMN "_lastEndDateTime" SET DEFAULT '"2050-01-01T14:00:00.000Z"'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "event" ALTER COLUMN "_lastEndDateTime" SET DEFAULT '2050-01-01 14:00:00'`,
		);
		await queryRunner.query(
			`ALTER TABLE "event" ALTER COLUMN "_firstStartDateTime" SET DEFAULT '2020-01-01 14:00:00'`,
		);
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_citizenAuthType"`);
	}
}
