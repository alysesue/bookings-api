import {MigrationInterface, QueryRunner} from "typeorm";

export class NewBookedSlots1638946454117 implements MigrationInterface {
    name = 'NewBookedSlots1638946454117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP CONSTRAINT "FK_0a24f74a667542687ad92198b24"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ff47cbef238b677049fbe25f9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_218fcc20e6872ee1331cedb2cb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0a24f74a667542687ad92198b2"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP COLUMN "_startDateTime"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP COLUMN "_endDateTime"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP COLUMN "_serviceProviderId"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD "_oneOffTimeslotId" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_5db9875e02f7921f5d9f7d4e8b" ON "booked_slot" ("_oneOffTimeslotId") `);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD CONSTRAINT "FK_5db9875e02f7921f5d9f7d4e8ba" FOREIGN KEY ("_oneOffTimeslotId") REFERENCES "one_off_timeslot"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP CONSTRAINT "FK_5db9875e02f7921f5d9f7d4e8ba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5db9875e02f7921f5d9f7d4e8b"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" DROP COLUMN "_oneOffTimeslotId"`);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD "_serviceProviderId" integer`);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD "_endDateTime" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD "_startDateTime" TIMESTAMP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_0a24f74a667542687ad92198b2" ON "booked_slot" ("_serviceProviderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_218fcc20e6872ee1331cedb2cb" ON "booked_slot" ("_endDateTime") `);
        await queryRunner.query(`CREATE INDEX "IDX_0ff47cbef238b677049fbe25f9" ON "booked_slot" ("_startDateTime") `);
        await queryRunner.query(`ALTER TABLE "booked_slot" ADD CONSTRAINT "FK_0a24f74a667542687ad92198b24" FOREIGN KEY ("_serviceProviderId") REFERENCES "service_provider"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
