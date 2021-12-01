import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingOwnerIdAndSingpassNullable1638241378905 implements MigrationInterface {
	name = 'BookingOwnerIdAndSingpassNullable1638241378905';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" ADD "_ownerId" integer NOT NULL`);
		await queryRunner.query(`ALTER TABLE "sing_pass_user" ALTER COLUMN "_molUserId" DROP NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "booking" ADD CONSTRAINT "FK_b1ff9366e2b4a4b5846f471fce9" FOREIGN KEY ("_ownerId") REFERENCES "user"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_b1ff9366e2b4a4b5846f471fce9"`);
		await queryRunner.query(`ALTER TABLE "sing_pass_user" ALTER COLUMN "_molUserId" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "_ownerId"`);
	}
}
