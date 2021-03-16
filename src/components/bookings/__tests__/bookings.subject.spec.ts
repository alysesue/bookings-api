import { BookingsPublisherProps, BookingsSubject } from '../bookings.subject';
import { MockObserver } from '../../../infrastructure/__mocks__/observer.mock';

describe('Should test booking subject', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should notify observer', () => {
		const bookingsSubject = new BookingsSubject();
		const mockObserver = new MockObserver();
		bookingsSubject.attach(mockObserver);
		bookingsSubject.notify({} as BookingsPublisherProps);
		expect(mockObserver.updateMock).toHaveBeenCalledTimes(1);
	});

	it('should not notify observer if detached', () => {
		const bookingsSubject = new BookingsSubject();
		const mockObserver = new MockObserver();
		bookingsSubject.attach(mockObserver);
		bookingsSubject.detach(mockObserver);
		bookingsSubject.notify({} as BookingsPublisherProps);
		expect(mockObserver.updateMock).toHaveBeenCalledTimes(0);
	});
});
