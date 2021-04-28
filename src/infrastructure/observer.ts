export interface ISubject<T> {
	// Attach an observer to the publisher.
	attach(observers: IObserver | IObserver[]): void;

	// Detach an observer from the publisher.
	detach(observers: IObserver | IObserver[]): void;

	// Notify all observers about an event.
	notify(e: T): void;
}

export interface IObserver {
	// Receive update from subject.
	update<T>(subject: ISubject<T>): void;
}

export abstract class Observer implements IObserver {
	public abstract update<T>(subject: ISubject<T>): void;
}

export abstract class Subject<T> implements ISubject<T> {
	private _observers: IObserver[] = [];
	public attach(observers: IObserver | IObserver[]): void {
		[].concat(observers).forEach((observer) => {
			if (this._observers.includes(observer)) return;
			this._observers.push(observer);
		});
	}

	public detach(observers: IObserver | IObserver[]): void {
		[].concat(observers).forEach((observer) => {
			const indexObs = this._observers.indexOf(observer);
			if (indexObs === -1) return;
			this._observers.splice(indexObs, 1);
		});
	}

	public notify(_e: T): void {
		this._observers.forEach((obs) => obs.update(this));
	}
}
