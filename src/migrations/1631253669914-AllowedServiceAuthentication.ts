import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowedServiceAuthentication1631253669914 implements MigrationInterface {
	name = 'AllowedServiceAuthentication1631253669914';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE "service__citizenauthentication_enum" AS ENUM('singpass', 'otp')`);
		await queryRunner.query(
			`ALTER TABLE "service" ADD "_citizenAuthentication" "service__citizenauthentication_enum" array NOT NULL DEFAULT '{singpass}'`,
		);

		// Data migration
		await queryRunner.query(
			`UPDATE public.service set "_citizenAuthentication" = '{otp}' where "_allowAnonymousBookings" = true`,
		);

		// drops old column
		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_allowAnonymousBookings"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "service" ADD "_allowAnonymousBookings" boolean NOT NULL DEFAULT false`);

		await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "_citizenAuthentication"`);
		await queryRunner.query(`DROP TYPE "service__citizenauthentication_enum"`);
	}
}
