import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultVideoConferenceLink1622109472715 implements MigrationInterface {
	name = 'DefaultVideoConferenceLink1622109472715';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_videoConferenceUrl" character varying(2000)`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_videoConferenceUrl"`);
	}
}
