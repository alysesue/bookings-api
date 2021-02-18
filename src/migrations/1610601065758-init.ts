import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1610601065758 implements MigrationInterface {
	public name = 'init1610601065758';

	// tslint:disable-next-line: no-big-function
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "timeslot_item" ("_id" SERIAL NOT NULL, "_timeslotsScheduleId" integer NOT NULL, "_weekDay" integer NOT NULL, "_startTime" TIME NOT NULL, "_endTime" TIME NOT NULL, "_capacity" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_7a301e1fea3689bc0d179ad33ae" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "timeslots_schedule" ("_id" SERIAL NOT NULL, CONSTRAINT "PK_aa2347bbea43c9a251a5ff1c68d" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "service_admin_group_map" ("_serviceId" integer NOT NULL, "_serviceOrganisationRef" character varying(40) NOT NULL, CONSTRAINT "REL_429cf862764b719db08fec3ada" UNIQUE ("_serviceId"), CONSTRAINT "PK_429cf862764b719db08fec3ada0" PRIMARY KEY ("_serviceId"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_a8888433b34fec3f0304b3eb51" ON "service_admin_group_map" ("_serviceOrganisationRef") `,
		);
		await queryRunner.query(
			`CREATE TABLE "organisation_admin_group_map" ("_organisationId" integer NOT NULL, "_organisationRef" character varying(20) NOT NULL, CONSTRAINT "REL_1927cd1967d2d0faf8df4a68ff" UNIQUE ("_organisationId"), CONSTRAINT "PK_1927cd1967d2d0faf8df4a68ffb" PRIMARY KEY ("_organisationId"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_c0ed708860a961ff992745217d" ON "organisation_admin_group_map" ("_organisationRef") `,
		);
		await queryRunner.query(
			`CREATE TABLE "organisation" ("_id" SERIAL NOT NULL, "_name" character varying(100) NOT NULL, CONSTRAINT "PK_9d2965fd82fb790a81d188917e3" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "week_day_schedule" ("id" SERIAL NOT NULL, "weekDay" integer NOT NULL, "hasScheduleForm" boolean NOT NULL, "openTime" TIME, "closeTime" TIME, "scheduleFormId" integer NOT NULL, CONSTRAINT "PK_6d37519d8f2b99dc5259b4ee79c" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_ecd59256d03d05e4ab4494d673" ON "week_day_schedule" ("scheduleFormId", "weekDay") `,
		);
		await queryRunner.query(
			`CREATE TABLE "schedule_form" ("id" SERIAL NOT NULL, "slotsDurationInMin" integer NOT NULL, CONSTRAINT "PK_98446629bf493cc620be62dccbb" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "service" ("_id" SERIAL NOT NULL, "_organisationId" integer NOT NULL, "_name" character varying(100) NOT NULL, "_scheduleFormId" integer, "_timeslotsScheduleId" integer, "_allowAnonymousBookings" boolean NOT NULL DEFAULT false, "_isOnHold" boolean DEFAULT false, CONSTRAINT "REL_b6598645275d079a1885da14e2" UNIQUE ("_scheduleFormId"), CONSTRAINT "REL_a3bb26f5fec94b7189134be920" UNIQUE ("_timeslotsScheduleId"), CONSTRAINT "PK_b99bce2b6999d1872fe69a4e199" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_7a0afae77585aa57e0b3667d0d" ON "service" ("_organisationId") `);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_6d3a90cb3af4511f82a2c71266" ON "service" ("_organisationId", "_name") `,
		);
		await queryRunner.query(
			`CREATE TABLE "service_provider_group_map" ("_serviceProviderId" integer NOT NULL, "_molAdminId" uuid NOT NULL, CONSTRAINT "REL_c369c0472c6ec65e7ab680d2bd" UNIQUE ("_serviceProviderId"), CONSTRAINT "PK_c369c0472c6ec65e7ab680d2bd7" PRIMARY KEY ("_serviceProviderId"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_4dbce3722acecedbfb06c2f9b5" ON "service_provider_group_map" ("_molAdminId") `,
		);
		await queryRunner.query(
			`CREATE TABLE "service_provider" ("_id" SERIAL NOT NULL, "_agencyUserId" character varying(100), "_createdAt" TIMESTAMP NOT NULL, "_serviceId" integer NOT NULL, "_name" character varying(300) NOT NULL, "_scheduleFormConfirmed" boolean NOT NULL DEFAULT false, "_email" character varying, "_phone" character varying, "_scheduleFormId" integer, "_timeslotsScheduleId" integer, "_expiryDate" TIMESTAMP, "_autoAcceptBookings" boolean NOT NULL DEFAULT true, CONSTRAINT "REL_a3a940df02e17439f77a25ca92" UNIQUE ("_scheduleFormId"), CONSTRAINT "REL_3cdc7bf0e4039e74de23292751" UNIQUE ("_timeslotsScheduleId"), CONSTRAINT "PK_c4e495206017c2fb10958bcedce" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_678ac0f59eda1d4bc936837029" ON "service_provider" ("_serviceId") `);
		await queryRunner.query(
			`CREATE TABLE "sing_pass_user" ("_id" SERIAL NOT NULL, "_UinFin" character varying(20) NOT NULL, "_molUserId" uuid NOT NULL, "_userId" integer NOT NULL, CONSTRAINT "REL_ded0ebe547be32a0cbd17e46b1" UNIQUE ("_userId"), CONSTRAINT "PK_66bc388e066d5e64dca2ffdce6c" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_b3e9ddcda04c04610f7f84586f" ON "sing_pass_user" ("_UinFin") `,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_542d45b6b6ffd4d1f75c2b129f" ON "sing_pass_user" ("_molUserId") `,
		);
		await queryRunner.query(
			`CREATE TABLE "admin_user" ("_id" SERIAL NOT NULL, "_molAdminId" uuid NOT NULL, "_agencyUserId" character varying(100), "_userName" character varying(100), "_email" character varying(100) NOT NULL, "_name" character varying(100), "_userId" integer NOT NULL, CONSTRAINT "REL_058337c098ddbb1e8c6c8a0496" UNIQUE ("_userId"), CONSTRAINT "PK_e8c27fdb52af7ba8caea3cc6b1c" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_84ce44c39ddac0553c65508864" ON "admin_user" ("_molAdminId") `,
		);
		await queryRunner.query(
			`CREATE TABLE "agency_user" ("_id" SERIAL NOT NULL, "_agencyAppId" character varying(100) NOT NULL, "_agencyName" character varying(100) NOT NULL, "_userId" integer NOT NULL, CONSTRAINT "REL_ccd84d041811d8bb5ff541f51f" UNIQUE ("_userId"), CONSTRAINT "PK_8fc93a49b5c92b21e3568f6b8ae" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_b14cc112ab008c0a282805b5be" ON "agency_user" ("_agencyAppId") `,
		);
		await queryRunner.query(
			`CREATE TABLE "anonymous_user" ("_id" SERIAL NOT NULL, "_createdAt" TIMESTAMP NOT NULL, "_trackingId" uuid NOT NULL, "_userId" integer NOT NULL, CONSTRAINT "REL_fb9b7f4277d8efb0d2970faef7" UNIQUE ("_userId"), CONSTRAINT "PK_288ff156cf74232d2ef5fbcbfde" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_a087ca969c607812d8fdc2a4f2" ON "anonymous_user" ("_trackingId") `,
		);
		await queryRunner.query(
			`CREATE TABLE "user" ("_id" SERIAL NOT NULL, CONSTRAINT "PK_457bfa3e35350a716846b03102d" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "booking" ("_version" integer NOT NULL, "_id" SERIAL NOT NULL, "_serviceId" integer NOT NULL, "_status" integer NOT NULL, "_startDateTime" TIMESTAMP NOT NULL, "_endDateTime" TIMESTAMP NOT NULL, "_refId" character varying, "_serviceProviderId" integer, "_citizenName" character varying, "_citizenUinFin" character varying(20), "_location" character varying, "_citizenPhone" character varying, "_onHoldUntil" TIMESTAMP, "_description" character varying, "_citizenEmail" character varying, "_creatorId" integer NOT NULL, CONSTRAINT "PK_00bbcb1a78c2f663a239309ae5c" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_252bd977dc904f03332589c3d8" ON "booking" ("_serviceId") `);
		await queryRunner.query(`CREATE INDEX "IDX_856f5189fbc39d8fd169029416" ON "booking" ("_startDateTime") `);
		await queryRunner.query(`CREATE INDEX "IDX_ff12f3970581120b5d57c3a0d9" ON "booking" ("_endDateTime") `);
		await queryRunner.query(`CREATE INDEX "IDX_f64f7016b7a3b34cd39e1d79c2" ON "booking" ("_serviceProviderId") `);
		await queryRunner.query(`CREATE INDEX "IDX_40f6d820e644ce3efad0df40e6" ON "booking" ("_citizenUinFin") `);
		await queryRunner.query(`CREATE INDEX "IDX_fc1a6f9bf68253b4b504009dfa" ON "booking" ("_onHoldUntil") `);
		await queryRunner.query(
			`CREATE TABLE "week_day_break" ("id" SERIAL NOT NULL, "weekDay" integer NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "scheduleFormId" integer NOT NULL, CONSTRAINT "PK_5d225ce3a7ff84807fc684010ec" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "unavailability" ("_id" SERIAL NOT NULL, "_serviceId" integer NOT NULL, "_start" TIMESTAMP NOT NULL, "_end" TIMESTAMP NOT NULL, "_allServiceProviders" boolean NOT NULL, CONSTRAINT "PK_520aa16adc20db8c9ff15176453" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_f075d9c30e0de11e0b561571f4" ON "unavailability" ("_serviceId") `);
		await queryRunner.query(`CREATE INDEX "IDX_61f5e0ccc114e766d8b77b2943" ON "unavailability" ("_start") `);
		await queryRunner.query(`CREATE INDEX "IDX_61ac161871b6bc61a7aef4b80e" ON "unavailability" ("_end") `);
		await queryRunner.query(
			`CREATE TABLE "booking_change_log" ("_id" SERIAL NOT NULL, "_timestamp" TIMESTAMP NOT NULL, "_serviceId" integer NOT NULL, "_bookingId" integer NOT NULL, "_action" integer NOT NULL, "_previousState" jsonb NOT NULL, "_newState" jsonb NOT NULL, "_userId" integer NOT NULL, CONSTRAINT "PK_d9de09b76b2747b7de364da3181" PRIMARY KEY ("_id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_66337027747d74f87f86a242fb" ON "booking_change_log" ("_timestamp") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_7bc1f267a438460aafae3f483c" ON "booking_change_log" ("_serviceId") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_5b2d6381ab66d11b1ddaea142b" ON "booking_change_log" ("_bookingId") `,
		);
		await queryRunner.query(
			`CREATE TABLE "unavailable_service_provider" ("unavailability_id" integer NOT NULL, "serviceProvider_id" integer NOT NULL, CONSTRAINT "PK_4938149b9542c773703af34733f" PRIMARY KEY ("unavailability_id", "serviceProvider_id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_40719484674eb25eaa7e0005d7" ON "unavailable_service_provider" ("unavailability_id") `,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_cee40cd53805ce55719a7e1215" ON "unavailable_service_provider" ("serviceProvider_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "timeslot_item" ADD CONSTRAINT "FK_59c31a55475155e379b6c92f4c7" FOREIGN KEY ("_timeslotsScheduleId") REFERENCES "timeslots_schedule"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" ADD CONSTRAINT "FK_429cf862764b719db08fec3ada0" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" ADD CONSTRAINT "FK_1927cd1967d2d0faf8df4a68ffb" FOREIGN KEY ("_organisationId") REFERENCES "organisation"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "week_day_schedule" ADD CONSTRAINT "FK_d9b30bfd7be23313c2370e6c157" FOREIGN KEY ("scheduleFormId") REFERENCES "schedule_form"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service" ADD CONSTRAINT "FK_7a0afae77585aa57e0b3667d0da" FOREIGN KEY ("_organisationId") REFERENCES "organisation"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service" ADD CONSTRAINT "FK_b6598645275d079a1885da14e25" FOREIGN KEY ("_scheduleFormId") REFERENCES "schedule_form"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service" ADD CONSTRAINT "FK_a3bb26f5fec94b7189134be9202" FOREIGN KEY ("_timeslotsScheduleId") REFERENCES "timeslots_schedule"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider_group_map" ADD CONSTRAINT "FK_c369c0472c6ec65e7ab680d2bd7" FOREIGN KEY ("_serviceProviderId") REFERENCES "service_provider"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider" ADD CONSTRAINT "FK_678ac0f59eda1d4bc9368370296" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider" ADD CONSTRAINT "FK_a3a940df02e17439f77a25ca92e" FOREIGN KEY ("_scheduleFormId") REFERENCES "schedule_form"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_provider" ADD CONSTRAINT "FK_3cdc7bf0e4039e74de23292751c" FOREIGN KEY ("_timeslotsScheduleId") REFERENCES "timeslots_schedule"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "sing_pass_user" ADD CONSTRAINT "FK_ded0ebe547be32a0cbd17e46b10" FOREIGN KEY ("_userId") REFERENCES "user"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "admin_user" ADD CONSTRAINT "FK_058337c098ddbb1e8c6c8a0496b" FOREIGN KEY ("_userId") REFERENCES "user"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "agency_user" ADD CONSTRAINT "FK_ccd84d041811d8bb5ff541f51ff" FOREIGN KEY ("_userId") REFERENCES "user"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "anonymous_user" ADD CONSTRAINT "FK_fb9b7f4277d8efb0d2970faef75" FOREIGN KEY ("_userId") REFERENCES "user"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "booking" ADD CONSTRAINT "FK_252bd977dc904f03332589c3d87" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "booking" ADD CONSTRAINT "FK_f64f7016b7a3b34cd39e1d79c21" FOREIGN KEY ("_serviceProviderId") REFERENCES "service_provider"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "booking" ADD CONSTRAINT "FK_7f97d67eef1be6bc6b3978d35e6" FOREIGN KEY ("_creatorId") REFERENCES "user"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "week_day_break" ADD CONSTRAINT "FK_26ca0e0fbdb3f15ec4059d000dc" FOREIGN KEY ("scheduleFormId") REFERENCES "schedule_form"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "unavailability" ADD CONSTRAINT "FK_f075d9c30e0de11e0b561571f4a" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "booking_change_log" ADD CONSTRAINT "FK_7bc1f267a438460aafae3f483ca" FOREIGN KEY ("_serviceId") REFERENCES "service"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "booking_change_log" ADD CONSTRAINT "FK_5b2d6381ab66d11b1ddaea142b5" FOREIGN KEY ("_bookingId") REFERENCES "booking"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "booking_change_log" ADD CONSTRAINT "FK_488976e66147a39155c77595f35" FOREIGN KEY ("_userId") REFERENCES "user"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_40719484674eb25eaa7e0005d73" FOREIGN KEY ("unavailability_id") REFERENCES "unavailability"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" ADD CONSTRAINT "FK_cee40cd53805ce55719a7e1215c" FOREIGN KEY ("serviceProvider_id") REFERENCES "service_provider"("_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
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
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_cee40cd53805ce55719a7e1215c"`,
		);
		await queryRunner.query(
			`ALTER TABLE "unavailable_service_provider" DROP CONSTRAINT "FK_40719484674eb25eaa7e0005d73"`,
		);
		await queryRunner.query(`ALTER TABLE "booking_change_log" DROP CONSTRAINT "FK_488976e66147a39155c77595f35"`);
		await queryRunner.query(`ALTER TABLE "booking_change_log" DROP CONSTRAINT "FK_5b2d6381ab66d11b1ddaea142b5"`);
		await queryRunner.query(`ALTER TABLE "booking_change_log" DROP CONSTRAINT "FK_7bc1f267a438460aafae3f483ca"`);
		await queryRunner.query(`ALTER TABLE "unavailability" DROP CONSTRAINT "FK_f075d9c30e0de11e0b561571f4a"`);
		await queryRunner.query(`ALTER TABLE "week_day_break" DROP CONSTRAINT "FK_26ca0e0fbdb3f15ec4059d000dc"`);
		await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_7f97d67eef1be6bc6b3978d35e6"`);
		await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_f64f7016b7a3b34cd39e1d79c21"`);
		await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_252bd977dc904f03332589c3d87"`);
		await queryRunner.query(`ALTER TABLE "anonymous_user" DROP CONSTRAINT "FK_fb9b7f4277d8efb0d2970faef75"`);
		await queryRunner.query(`ALTER TABLE "agency_user" DROP CONSTRAINT "FK_ccd84d041811d8bb5ff541f51ff"`);
		await queryRunner.query(`ALTER TABLE "admin_user" DROP CONSTRAINT "FK_058337c098ddbb1e8c6c8a0496b"`);
		await queryRunner.query(`ALTER TABLE "sing_pass_user" DROP CONSTRAINT "FK_ded0ebe547be32a0cbd17e46b10"`);
		await queryRunner.query(`ALTER TABLE "service_provider" DROP CONSTRAINT "FK_3cdc7bf0e4039e74de23292751c"`);
		await queryRunner.query(`ALTER TABLE "service_provider" DROP CONSTRAINT "FK_a3a940df02e17439f77a25ca92e"`);
		await queryRunner.query(`ALTER TABLE "service_provider" DROP CONSTRAINT "FK_678ac0f59eda1d4bc9368370296"`);
		await queryRunner.query(
			`ALTER TABLE "service_provider_group_map" DROP CONSTRAINT "FK_c369c0472c6ec65e7ab680d2bd7"`,
		);
		await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "FK_a3bb26f5fec94b7189134be9202"`);
		await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "FK_b6598645275d079a1885da14e25"`);
		await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "FK_7a0afae77585aa57e0b3667d0da"`);
		await queryRunner.query(`ALTER TABLE "week_day_schedule" DROP CONSTRAINT "FK_d9b30bfd7be23313c2370e6c157"`);
		await queryRunner.query(
			`ALTER TABLE "organisation_admin_group_map" DROP CONSTRAINT "FK_1927cd1967d2d0faf8df4a68ffb"`,
		);
		await queryRunner.query(
			`ALTER TABLE "service_admin_group_map" DROP CONSTRAINT "FK_429cf862764b719db08fec3ada0"`,
		);
		await queryRunner.query(`ALTER TABLE "timeslot_item" DROP CONSTRAINT "FK_59c31a55475155e379b6c92f4c7"`);
		await queryRunner.query(`DROP INDEX "IDX_cee40cd53805ce55719a7e1215"`);
		await queryRunner.query(`DROP INDEX "IDX_40719484674eb25eaa7e0005d7"`);
		await queryRunner.query(`DROP TABLE "unavailable_service_provider"`);
		await queryRunner.query(`DROP INDEX "IDX_5b2d6381ab66d11b1ddaea142b"`);
		await queryRunner.query(`DROP INDEX "IDX_7bc1f267a438460aafae3f483c"`);
		await queryRunner.query(`DROP INDEX "IDX_66337027747d74f87f86a242fb"`);
		await queryRunner.query(`DROP TABLE "booking_change_log"`);
		await queryRunner.query(`DROP INDEX "IDX_61ac161871b6bc61a7aef4b80e"`);
		await queryRunner.query(`DROP INDEX "IDX_61f5e0ccc114e766d8b77b2943"`);
		await queryRunner.query(`DROP INDEX "IDX_f075d9c30e0de11e0b561571f4"`);
		await queryRunner.query(`DROP TABLE "unavailability"`);
		await queryRunner.query(`DROP TABLE "week_day_break"`);
		await queryRunner.query(`DROP INDEX "IDX_fc1a6f9bf68253b4b504009dfa"`);
		await queryRunner.query(`DROP INDEX "IDX_40f6d820e644ce3efad0df40e6"`);
		await queryRunner.query(`DROP INDEX "IDX_f64f7016b7a3b34cd39e1d79c2"`);
		await queryRunner.query(`DROP INDEX "IDX_ff12f3970581120b5d57c3a0d9"`);
		await queryRunner.query(`DROP INDEX "IDX_856f5189fbc39d8fd169029416"`);
		await queryRunner.query(`DROP INDEX "IDX_252bd977dc904f03332589c3d8"`);
		await queryRunner.query(`DROP TABLE "booking"`);
		await queryRunner.query(`DROP TABLE "user"`);
		await queryRunner.query(`DROP INDEX "IDX_a087ca969c607812d8fdc2a4f2"`);
		await queryRunner.query(`DROP TABLE "anonymous_user"`);
		await queryRunner.query(`DROP INDEX "IDX_b14cc112ab008c0a282805b5be"`);
		await queryRunner.query(`DROP TABLE "agency_user"`);
		await queryRunner.query(`DROP INDEX "IDX_84ce44c39ddac0553c65508864"`);
		await queryRunner.query(`DROP TABLE "admin_user"`);
		await queryRunner.query(`DROP INDEX "IDX_542d45b6b6ffd4d1f75c2b129f"`);
		await queryRunner.query(`DROP INDEX "IDX_b3e9ddcda04c04610f7f84586f"`);
		await queryRunner.query(`DROP TABLE "sing_pass_user"`);
		await queryRunner.query(`DROP INDEX "IDX_678ac0f59eda1d4bc936837029"`);
		await queryRunner.query(`DROP TABLE "service_provider"`);
		await queryRunner.query(`DROP INDEX "IDX_4dbce3722acecedbfb06c2f9b5"`);
		await queryRunner.query(`DROP TABLE "service_provider_group_map"`);
		await queryRunner.query(`DROP INDEX "IDX_6d3a90cb3af4511f82a2c71266"`);
		await queryRunner.query(`DROP INDEX "IDX_7a0afae77585aa57e0b3667d0d"`);
		await queryRunner.query(`DROP TABLE "service"`);
		await queryRunner.query(`DROP TABLE "schedule_form"`);
		await queryRunner.query(`DROP INDEX "IDX_ecd59256d03d05e4ab4494d673"`);
		await queryRunner.query(`DROP TABLE "week_day_schedule"`);
		await queryRunner.query(`DROP TABLE "organisation"`);
		await queryRunner.query(`DROP INDEX "IDX_c0ed708860a961ff992745217d"`);
		await queryRunner.query(`DROP TABLE "organisation_admin_group_map"`);
		await queryRunner.query(`DROP INDEX "IDX_a8888433b34fec3f0304b3eb51"`);
		await queryRunner.query(`DROP TABLE "service_admin_group_map"`);
		await queryRunner.query(`DROP TABLE "timeslots_schedule"`);
		await queryRunner.query(`DROP TABLE "timeslot_item"`);
	}
}
