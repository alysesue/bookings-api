import { LifeSGServiceMock } from '../__mocks__/lifesg.service.mock';
import { Container } from 'typescript-ioc';
import {
	BookingsSubjectMock,
	OnHoldBookingSubjectMock,
	PendingApprovalBookingSubjectMock,
} from '../../bookings/__mocks__/bookings.subject.mock';
import { BookingsSubject } from '../../bookings/bookings.subject';
import { LifeSGMQService } from '../lifesg.service';
import { LifeSGObserver } from '../lifesg.observer';

describe('Test lifesg mq observer', () => {
	beforeAll(() => {
		Container.bind(LifeSGMQService).to(LifeSGServiceMock);
		Container.bind(BookingsSubject).to(BookingsSubjectMock);
	});

	it('Should not send to mq when booking is pending approval', async () => {
		const instance = await Container.get(LifeSGObserver);
		instance.update(new PendingApprovalBookingSubjectMock());
		expect(LifeSGServiceMock.sendToMQ).toHaveBeenCalledTimes(0);
	});

	it('Should not send to mq when booking is on hold', async () => {
		const instance = await Container.get(LifeSGObserver);
		instance.update(new OnHoldBookingSubjectMock());
		expect(LifeSGServiceMock.sendToMQ).toHaveBeenCalledTimes(0);
	});

	it('Should send to mq when booking is any other state except pending approval or on hold', async () => {
		const instance = await Container.get(LifeSGObserver);
		instance.update(new BookingsSubjectMock());
		expect(LifeSGServiceMock.sendToMQ).toHaveBeenCalledTimes(1);
	});
});
