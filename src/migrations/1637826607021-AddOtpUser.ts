import {MigrationInterface, QueryRunner} from "typeorm";

export class AddOtpUser1637826607021 implements MigrationInterface {
    name = 'AddOtpUser1637826607021'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "otp_user" ("_id" SERIAL NOT NULL, "_mobileNo" character varying NOT NULL, "_userId" integer NOT NULL, CONSTRAINT "REL_62560eab4f47190ab50acdd474" UNIQUE ("_userId"), CONSTRAINT "PK_86c8de96e76b5c98d542538ef52" PRIMARY KEY ("_id"))`);
        await queryRunner.query(`ALTER TABLE "otp_user" ADD CONSTRAINT "FK_62560eab4f47190ab50acdd4749" FOREIGN KEY ("_userId") REFERENCES "user"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_user" DROP CONSTRAINT "FK_62560eab4f47190ab50acdd4749"`);
        await queryRunner.query(`DROP TABLE "otp_user"`);
    }

}
