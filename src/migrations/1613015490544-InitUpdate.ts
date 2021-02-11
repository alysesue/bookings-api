import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitUpdate1613015490544 implements MigrationInterface {
	public name = 'InitUpdate1613015490544';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" DROP CONSTRAINT "FK_429cf862764b719db08fec3ada0"`,
		);
		await queryRunner.query(`COMMENT ON COLUMN "service_admin_group_map"."_serviceId" IS NULL`);
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" ADD CONSTRAINT "UQ_429cf862764b719db08fec3ada0" UNIQUE ("_serviceId")`,
		);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" DROP CONSTRAINT "FK_1927cd1967d2d0faf8df4a68ffb"`,
		);
		await queryRunner.query(`COMMENT ON COLUMN "organisation_admin_group_map"."_organisationId" IS NULL`);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" ADD CONSTRAINT "UQ_1927cd1967d2d0faf8df4a68ffb" UNIQUE ("_organisationId")`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider_group_map" DROP CONSTRAINT "FK_c369c0472c6ec65e7ab680d2bd7"`,
		);
		await queryRunner.query(`COMMENT ON COLUMN "service_provider_group_map"."_serviceProviderId" IS NULL`);
		await queryRunner.query(
			`ALTER TABLE "service_provider_group_map" ADD CONSTRAINT "UQ_c369c0472c6ec65e7ab680d2bd7" UNIQUE ("_serviceProviderId")`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" ADD CONSTRAINT "FK_429cf862764b719db08fec3ada0" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" ADD CONSTRAINT "FK_1927cd1967d2d0faf8df4a68ffb" FOREIGN KEY ("_organisationId") REFERENCES "organisation"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider_group_map" ADD CONSTRAINT "FK_c369c0472c6ec65e7ab680d2bd7" FOREIGN KEY ("_serviceProviderId") REFERENCES "service_provider"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "service_provider_group_map" DROP CONSTRAINT "FK_c369c0472c6ec65e7ab680d2bd7"`,
		);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" DROP CONSTRAINT "FK_1927cd1967d2d0faf8df4a68ffb"`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" DROP CONSTRAINT "FK_429cf862764b719db08fec3ada0"`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider_group_map" DROP CONSTRAINT "UQ_c369c0472c6ec65e7ab680d2bd7"`,
		);
		await queryRunner.query(`COMMENT ON COLUMN "service_provider_group_map"."_serviceProviderId" IS NULL`);
		await queryRunner.query(
			`ALTER TABLE "service_provider_group_map" ADD CONSTRAINT "FK_c369c0472c6ec65e7ab680d2bd7" FOREIGN KEY ("_serviceProviderId") REFERENCES "service_provider"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" DROP CONSTRAINT "UQ_1927cd1967d2d0faf8df4a68ffb"`,
		);
		await queryRunner.query(`COMMENT ON COLUMN "organisation_admin_group_map"."_organisationId" IS NULL`);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" ADD CONSTRAINT "FK_1927cd1967d2d0faf8df4a68ffb" FOREIGN KEY ("_organisationId") REFERENCES "organisation"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" DROP CONSTRAINT "UQ_429cf862764b719db08fec3ada0"`,
		);
		await queryRunner.query(`COMMENT ON COLUMN "service_admin_group_map"."_serviceId" IS NULL`);
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" ADD CONSTRAINT "FK_429cf862764b719db08fec3ada0" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}
}
