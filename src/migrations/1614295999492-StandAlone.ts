import { MigrationInterface, QueryRunner } from 'typeorm';

export class StandAlone1614295999492 implements MigrationInterface {
	public name = 'StandAlone1614295999492';
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_isStandAlone" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "_isOnHold" SET NOT NULL`);
		await queryRunner.query(`COMMENT ON COLUMN "service"."_isOnHold" IS NULL`);
	}
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`COMMENT ON COLUMN "service"."_isOnHold" IS NULL`);
		await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "_isOnHold" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_isStandAlone"`);
	}
}
