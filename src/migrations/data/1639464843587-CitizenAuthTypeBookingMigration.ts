import { MigrationInterface, QueryRunner } from 'typeorm';

export class CitizenAuthTypeBookingMigration1639464843587 implements MigrationInterface {
	name = 'CitizenAuthTypeBookingMigration1639464843587';
  public async up(queryRunner: QueryRunner): Promise<void> {
    // For Singpass
		await queryRunner.query(`
    do $$
      DECLARE
        t_row record;
      BEGIN
        FOR t_row in
        SELECT * FROM booking
        WHERE booking."_citizenAuthType" = '{singpass}'
        LOOP
          UPDATE booking set "_citizenAuthType" = 'singpass' where _id = t_row._id;
        END LOOP;
    END;
    $$;
    `);

    // For OTP
    await queryRunner.query(`
    do $$
      DECLARE
        t_row record;
      BEGIN
        FOR t_row in
        SELECT * FROM booking
        WHERE booking."_citizenAuthType" = '{otp}'
        LOOP
          UPDATE booking set "_citizenAuthType" = 'otp' where _id = t_row._id;
        END LOOP;
    END;
    $$;
    `);
	}

	public async down(_queryRunner: QueryRunner): Promise<void> {}
}
