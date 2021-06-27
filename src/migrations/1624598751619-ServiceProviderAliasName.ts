import {MigrationInterface, QueryRunner} from "typeorm";

export class ServiceProviderAliasName1624598751619 implements MigrationInterface {
    name = 'ServiceProviderAliasName1624598751619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_provider" ADD "_aliasName" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_provider" DROP COLUMN "_aliasName"`);
    }

}
