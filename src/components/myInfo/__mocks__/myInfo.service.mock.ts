import { MyInfoService } from '../myInfo.service';

export class MyInfoServiceeMock implements Partial<MyInfoService> {
	public static getMyInfo = jest.fn();
	public async getMyInfo(...params): Promise<void> {
		return MyInfoServiceeMock.getMyInfo(...params);
	}
}
