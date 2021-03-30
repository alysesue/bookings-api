import {MigrationInterface, QueryRunner} from "typeorm";

export class OneOffTimeSlotLabels1617073497325 implements MigrationInterface {
    name = 'OneOffTimeSlotLabels1617073497325'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "label" ADD "_oneOffTimeslotId" integer`);
        await queryRunner.query(`ALTER TABLE "label" ADD CONSTRAINT "FK_5c2d312ef3baba8f7c29c418441" FOREIGN KEY ("_oneOffTimeslotId") REFERENCES "one_off_timeslot"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "label" DROP CONSTRAINT "FK_5c2d312ef3baba8f7c29c418441"`);
        await queryRunner.query(`ALTER TABLE "label" DROP COLUMN "_oneOffTimeslotId"`);
    }

}
