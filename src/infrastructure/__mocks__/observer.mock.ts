import { IObserver, ISubject } from '../observer';

export class MockObserver implements IObserver {
	public updateMock = jest.fn();
	public update(publisher: ISubject<any>): void {
		this.updateMock();
	}
}
