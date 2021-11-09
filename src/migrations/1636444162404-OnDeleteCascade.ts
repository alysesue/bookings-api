import { MigrationInterface, QueryRunner } from 'typeorm';

export class OnDeleteCascade1636444162404 implements MigrationInterface {
	name = 'OnDeleteCascade1636444162404';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada"`);
		await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d"`);
		await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9"`);
		await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21"`);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_cee40cd53805ce55719a7e1215c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_40719484674eb25eaa7e0005d73"`,
		);
		await queryRunner.query(
			`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada" FOREIGN KEY ("label_id") REFERENCES "service_provider_label"("_id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "event_label" ADD CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9" FOREIGN KEY ("event_id") REFERENCES "event"("_id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "event_label" ADD CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21" FOREIGN KEY ("label_id") REFERENCES "label"("_id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_40719484674eb25eaa7e0005d73" FOREIGN KEY ("unavailability_id") REFERENCES "unavailability"("_id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_cee40cd53805ce55719a7e1215c" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_cee40cd53805ce55719a7e1215c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_40719484674eb25eaa7e0005d73"`,
		);
		await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21"`);
		await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9"`);
		await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada"`);
		await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d"`);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_40719484674eb25eaa7e0005d73" FOREIGN KEY ("unavailability_id") REFERENCES "unavailability"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_cee40cd53805ce55719a7e1215c" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "event_label" ADD CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21" FOREIGN KEY ("label_id") REFERENCES "label"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "event_label" ADD CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9" FOREIGN KEY ("event_id") REFERENCES "event"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada" FOREIGN KEY ("label_id") REFERENCES "service_provider_label"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}
}
