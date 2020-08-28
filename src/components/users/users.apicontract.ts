export interface UserRequest {}

export class Citizen implements UserRequest {
	public userMolId?: string;
	public userUinFin?: string;
	public static isCitizen = (p : any): p is Citizen => !!p?.userMolId;
}