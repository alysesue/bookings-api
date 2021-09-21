import { MigrationInterface, QueryRunner } from 'typeorm';

// To try migration
// 1-) Remove column MigrationDataTimeslotToEvent1624972430588 from migration
// 2-) populate some data with npm run seed
// 3-) Launch server
export class MigrationDataTimeslotToEvent implements MigrationInterface {
	name = 'MigrationDataTimeslotToEvent1624972430588';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
COMMIT;
--open transaction
BEGIN;

--avoid concurrent writes
LOCK event IN ROW SHARE MODE;
LOCK one_off_timeslot IN ROW SHARE MODE;

DROP SEQUENCE IF EXISTS new_table_seq;
--create a sequence to populate new_table.id
CREATE SEQUENCE new_table_seq;

--Delete FK
ALTER TABLE "one_off_timeslot" DROP CONSTRAINT IF EXISTS "FK_c0a3502bdee1a4efe0bacdbbd0a";
ALTER TABLE "event_label" DROP CONSTRAINT IF EXISTS "FK_71f31ac9ef886bb5948c1de30e9";

-- Add a column reminder_id to the event.
-- Populate it with original IDs from reminder table.
-- Use it to join reminder with the dateset table. Drop the temporary column.
ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "reminder_id" integer;

INSERT INTO "event"("_description", "_title", "_capacity", "_serviceId", "reminder_id")
SELECT slot."_description", slot."_title", slot._capacity, s._id, slot._id FROM one_off_timeslot slot
    LEFT JOIN service_provider sp
    ON slot."_serviceProviderId" = sp._id
    LEFT JOIN service s
     ON sp."_serviceId" = s._id;

UPDATE  "one_off_timeslot" as slot SET "_eventId" = event._id
FROM event
WHERE slot._id = event.reminder_id;

-- Delete reminder_id
ALTER TABLE event DROP COLUMN IF EXISTS reminder_id;

-- Do the same for label but dont need reminder_id
LOCK event_label IN ROW SHARE MODE;
LOCK oneofftimeslot_label IN ROW SHARE MODE;

INSERT INTO public."event_label"("event_id", "label_id")
SELECT slot."_eventId", oneofftimeslot_label."label_id" FROM oneofftimeslot_label
     LEFT JOIN one_off_timeslot slot
               ON oneofftimeslot_label."oneOffTimeslot_id" = slot._id;

--Create a proper FK
ALTER TABLE "one_off_timeslot" ADD CONSTRAINT  "FK_c0a3502bdee1a4efe0bacdbbd0a"
    FOREIGN KEY ("_eventId") REFERENCES "event"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "event_label" ADD CONSTRAINT "FK_71f31ac9ef886bb5948c1de30e9"
    FOREIGN KEY ("event_id") REFERENCES "event"("_id") ON DELETE CASCADE ON UPDATE NO ACTION;

DROP SEQUENCE IF EXISTS new_table_seq;

--end transaction
COMMIT;
`);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async down(queryRunner: QueryRunner): Promise<void> {}
}
