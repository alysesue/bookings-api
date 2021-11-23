import { MigrationInterface, QueryRunner } from 'typeorm';

export class MandatoryEventTitle1636358550171 implements MigrationInterface {
	name = 'MandatoryEventTitle1636358550171';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`UPDATE "event" SET "_title" = 'Nameless' WHERE "_title" IS NULL OR "_title" = ''`);
		await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "_title" type character varying(100)`);
		await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "_title" SET NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "event" ADD CONSTRAINT "CHK_19699af6b34f587733340fcf18" CHECK ("_title" <> '')`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "CHK_19699af6b34f587733340fcf18"`);
		await queryRunner.query(`UPDATE "event" SET "_title" = '' WHERE "_title" = 'Nameless'`);
		await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "_title" type character varying(5000)`);
		await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "_title" DROP NOT NULL`);
	}
}
