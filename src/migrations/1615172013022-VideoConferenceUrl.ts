import { MigrationInterface, QueryRunner } from 'typeorm';

export class VideoConferenceUrl1615172013022 implements MigrationInterface {
	public name = 'VideoConferenceUrl1615172013022';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" ADD "_videoConferenceUrl" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_videoConferenceUrl"`);
	}
}
