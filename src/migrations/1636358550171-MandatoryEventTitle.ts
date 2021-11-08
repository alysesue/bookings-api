import { MigrationInterface, QueryRunner } from 'typeorm';

export class MandatoryEventTitle1636358550171 implements MigrationInterface {
	name = 'MandatoryEventTitle1636358550171';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "_title"`);
		await queryRunner.query(`ALTER TABLE "event" ADD "_title" character varying(100) NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "event" ADD CONSTRAINT "CHK_19699af6b34f587733340fcf18" CHECK ("_title" <> '')`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "CHK_19699af6b34f587733340fcf18"`);
		await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "_title"`);
		await queryRunner.query(`ALTER TABLE "event" ADD "_title" character varying(5000)`);
	}
}
