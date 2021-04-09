import { LifeSGServiceMock } from '../__mocks__/lifesg.service.mock';
import { Container } from 'typescript-ioc';
import { BookingsSubjectMock } from '../../bookings/__mocks__/bookings.subject.mock';
import { BookingsSubject } from '../../bookings/bookings.subject';
import { LifeSGMQSerice } from '../lifesg.service';
import { LifeSGObserver } from '../lifesg.observer';

describe('Test lifesg mq observer', () => {
	beforeAll(() => {
		Container.bind(LifeSGMQSerice).to(LifeSGServiceMock);
		Container.bind(BookingsSubject).to(BookingsSubjectMock);
	});

	it('Should send to mq when booking is any other state except pending approval', async () => {
		const instance = await Container.get(LifeSGObserver);
		instance.update(new BookingsSubjectMock());
		expect(LifeSGServiceMock.sendToMQ).toHaveBeenCalledTimes(1);
	});
});
