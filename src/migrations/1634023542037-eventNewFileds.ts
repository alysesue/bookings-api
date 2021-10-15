import { MigrationInterface, QueryRunner } from 'typeorm';
import { Singleton } from 'typescript-ioc';

@Singleton
export class EventNewFileds1634023542037 implements MigrationInterface {
	name = 'eventNewFileds1634023542037';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "event" ADD "_firstStartDateTime" TIMESTAMP NOT NULL DEFAULT '"2020-01-01T14:00:00.000Z"'`,
		);
		await queryRunner.query(
			`ALTER TABLE "event" ADD "_lastEndDateTime" TIMESTAMP NOT NULL DEFAULT '"2050-01-01T14:00:00.000Z"'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "_lastEndDateTime"`);
		await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "_firstStartDateTime"`);
	}
}
