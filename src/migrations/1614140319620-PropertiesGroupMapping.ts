import { MigrationInterface, QueryRunner } from 'typeorm';

export class PropertiesGroupMapping1614140319620 implements MigrationInterface {
	public name = 'PropertiesGroupMapping1614140319620';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_a8888433b34fec3f0304b3eb51"`);
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" ALTER "_serviceOrganisationRef" TYPE character varying(1000);`,
		);
		await queryRunner.query(`DROP INDEX "IDX_c0ed708860a961ff992745217d"`);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" ALTER "_organisationRef" TYPE character varying(1000);`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_a8888433b34fec3f0304b3eb51" ON "service_admin_group_map" ("_serviceOrganisationRef") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_c0ed708860a961ff992745217d" ON "organisation_admin_group_map" ("_organisationRef") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_c0ed708860a961ff992745217d"`);
		await queryRunner.query(`DROP INDEX "IDX_a8888433b34fec3f0304b3eb51"`);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" ALTER "_organisationRef" TYPE character varying(20);`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_c0ed708860a961ff992745217d" ON "organisation_admin_group_map" ("_organisationRef") `,
		);
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" ALTER "_serviceOrganisationRef" TYPE character varying(40);`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_a8888433b34fec3f0304b3eb51" ON "service_admin_group_map" ("_serviceOrganisationRef") `,
		);
	}
}
