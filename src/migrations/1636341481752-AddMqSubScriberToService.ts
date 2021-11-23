import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMqSubScriberToService1636341481752 implements MigrationInterface {
	name = 'AddMqSubScriberToService1636341481752';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE "service__mqsubscriber_enum" AS ENUM('lifesg')`);
		await queryRunner.query(
			`ALTER TABLE "service" ADD "_mqSubscriber" "service__mqsubscriber_enum" array NOT NULL DEFAULT '{}'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_mqSubscriber"`);
		await queryRunner.query(`DROP TYPE "service__mqsubscriber_enum"`);
	}
}
