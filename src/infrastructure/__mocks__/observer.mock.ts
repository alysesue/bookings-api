import { Observer } from '../observer';

export class MockObserver implements Observer {
	public updateMock = jest.fn();
	public update(...params): void {
		this.updateMock(...params);
	}
}
