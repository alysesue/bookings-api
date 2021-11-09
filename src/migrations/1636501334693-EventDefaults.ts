import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventDefaults1636501334693 implements MigrationInterface {
	name = 'EventDefaults1636501334693';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "_firstStartDateTime" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "_lastEndDateTime" DROP DEFAULT`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "event" ALTER COLUMN "_lastEndDateTime" SET DEFAULT '2050-01-01 14:00:00'`,
		);
		await queryRunner.query(
			`ALTER TABLE "event" ALTER COLUMN "_firstStartDateTime" SET DEFAULT '2020-01-01 14:00:00'`,
		);
	}
}
