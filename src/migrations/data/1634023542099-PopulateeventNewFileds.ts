import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateEventNewFields implements MigrationInterface {
	name = 'PopulateEventNewFields1634023542099';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
COMMIT;
--open transaction
BEGIN;

--avoid concurrent writes
LOCK event IN ROW SHARE MODE;

UPDATE public."event" as event
SET "_firstStartDateTime" = slot.minDate,
    "_lastEndDateTime" = slot.maxDate
FROM (SELECT MIN(slot."_startDateTime") as minDate, slot."_eventId", MAX(slot."_endDateTime") as maxDate
    FROM one_off_timeslot slot
    LEFT JOIN event event
        ON event."_id" = slot."_eventId"
            WHERE true
                GROUP BY slot."_eventId")
as slot
WHERE  event."_id" = slot."_eventId";

--end transaction
COMMIT;
`);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async down(queryRunner: QueryRunner): Promise<void> {}
}
