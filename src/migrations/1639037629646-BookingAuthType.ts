import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingAuthType1639037629646 implements MigrationInterface {
	name = 'BookingAuthType1639037629646';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" ADD "_citizenAuthType" character varying`);
    await queryRunner.query(`
      do $$
        DECLARE
          t_row record;
        BEGIN
          FOR t_row in
          SELECT * FROM booking
          INNER JOIN service ON booking."_serviceId" = service._id
          WHERE booking."_citizenAuthType" IS NULL
          LOOP
            update booking set "_citizenAuthType" = t_row."_citizenAuthentication" where _id = t_row._id;
          END LOOP;
        END;
      $$;`
    );
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_citizenAuthType"`);
	}
}
