import { MyInfo } from 'singpass-myinfo-oidc-helper';

export type MyInfoResponse = MyInfo.MyInfoComponents.Schemas.PersonCommon &
	MyInfo.MyInfoComponents.Schemas.PersonFinancial;

export type MyInfoWrapperResponse = {
	data: MyInfoResponse;
};
