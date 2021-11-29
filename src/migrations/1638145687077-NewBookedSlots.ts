import {MigrationInterface, QueryRunner} from "typeorm";

export class NewBookedSlots1638145687077 implements MigrationInterface {
    name = 'NewBookedSlots1638145687077'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP CONSTRAINT "FK_0a24f74a667542687ad92198b24"`);
        await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada"`);
        await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d"`);
        await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21"`);
        await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9"`);
        await queryRunner.query(`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_cee40cd53805ce55719a7e1215c"`);
        await queryRunner.query(`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_40719484674eb25eaa7e0005d73"`);
        await queryRunner.query(`DROP INDEX "IDX_0ff47cbef238b677049fbe25f9"`);
        await queryRunner.query(`DROP INDEX "IDX_218fcc20e6872ee1331cedb2cb"`);
        await queryRunner.query(`DROP INDEX "IDX_0a24f74a667542687ad92198b2"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP COLUMN "_startDateTime"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP COLUMN "_endDateTime"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP COLUMN "_serviceProviderId"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD "_oneOffTimeslotId" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_5db9875e02f7921f5d9f7d4e8b" ON "booked_slot" ("_oneOffTimeslotId") `);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD CONSTRAINT "FK_5db9875e02f7921f5d9f7d4e8ba" FOREIGN KEY ("_oneOffTimeslotId") REFERENCES "one_off_timeslot"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada" FOREIGN KEY ("label_id") REFERENCES "service_provider_label"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_label" ADD CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9" FOREIGN KEY ("event_id") REFERENCES "event"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_label" ADD CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21" FOREIGN KEY ("label_id") REFERENCES "label"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_40719484674eb25eaa7e0005d73" FOREIGN KEY ("unavailability_id") REFERENCES "unavailability"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_cee40cd53805ce55719a7e1215c" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_cee40cd53805ce55719a7e1215c"`);
        await queryRunner.query(`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_40719484674eb25eaa7e0005d73"`);
        await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21"`);
        await queryRunner.query(`ALTER TABLE "event_label" DROP CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9"`);
        await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada"`);
        await queryRunner.query(`ALTER TABLE "serviceprovider_label" DROP CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP CONSTRAINT "FK_5db9875e02f7921f5d9f7d4e8ba"`);
        await queryRunner.query(`DROP INDEX "IDX_5db9875e02f7921f5d9f7d4e8b"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP COLUMN "_oneOffTimeslotId"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD "_serviceProviderId" integer`);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD "_endDateTime" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD "_startDateTime" TIMESTAMP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_0a24f74a667542687ad92198b2" ON "booked_slot" ("_serviceProviderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_218fcc20e6872ee1331cedb2cb" ON "booked_slot" ("_endDateTime") `);
        await queryRunner.query(`CREATE INDEX "IDX_0ff47cbef238b677049fbe25f9" ON "booked_slot" ("_startDateTime") `);
        await queryRunner.query(`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_40719484674eb25eaa7e0005d73" FOREIGN KEY ("unavailability_id") REFERENCES "unavailability"("_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_cee40cd53805ce55719a7e1215c" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "event_label" ADD CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9" FOREIGN KEY ("event_id") REFERENCES "event"("_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "event_label" ADD CONSTRAINT "FK_7fd499d6df8a55e7e7f9cbd8f21" FOREIGN KEY ("label_id") REFERENCES "label"("_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_bcde96a1ffeb0937c61e8bbc69d" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "serviceprovider_label" ADD CONSTRAINT "FK_e7feecead79f3b044aa5fbc9ada" FOREIGN KEY ("label_id") REFERENCES "service_provider_label"("_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD CONSTRAINT "FK_0a24f74a667542687ad92198b24" FOREIGN KEY ("_serviceProviderId") REFERENCES "service_provider"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
