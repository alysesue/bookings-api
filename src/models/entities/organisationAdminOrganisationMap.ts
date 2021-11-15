import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import {IOrganisation, IService, IUser} from '../interfaces';

@Entity()
export class OrganisationAdminOrganisationMap {
    @PrimaryColumn()
    private _adminId: number;

    public set adminId(value: number) {
        this._adminId = value;
    }

    public get adminId() {
        return this._adminId;
    }

    @OneToOne('AdminUser', { nullable: false })
    @JoinColumn({ name: '_id' })
    public _adminUser: IUser;

    @Column()
    private _organisationId: number;

    public set organisationId(value: number) {
        this._organisationId = value;
    }

    public get organisationId() {
        return this._organisationId;
    }

    @OneToOne('Organisation', { nullable: false })
    @JoinColumn({ name: '_organisationId' })
    public _organisation: IOrganisation;
}
