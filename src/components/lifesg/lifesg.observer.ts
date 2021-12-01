/* eslint-disable max-len */
import { BookingStatus } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { IObserver, ISubject } from '../../infrastructure/observer';
import { BookingsSubject } from '../bookings/bookings.subject';
import { LifeSGMapper } from './lifesg.mapper';
import { LifeSGMQSerivce } from './lifesg.service';
import { MqSubscriberType } from '../../models/mqSubscriberTypes';
import { AppointmentAgency } from 'mol-lib-api-contract/appointment';
@InRequestScope
export class LifeSGObserver implements IObserver {
	@Inject
	private lifeSGMQSerivce: LifeSGMQSerivce;
	/**
	 * This method will send an accepted or cancelled booking to LifeSG's appointment service, a booking entity on BSG is an appointment entity in LifeSG appointment service
	 * Over at LifeSG, what they will do with the booking data is to display it in the LifeSG mobile app, so that LifeSG users can view bookings made in BSG on the LifeSG mobile app
	 * The following method will check that booking.service.mqSubscriber contains LifeSG enum, hence if we want bookings to be piped to LifeSG, we will need to set the service level setting mqSubscriber to {lifesg}
	 *
	 * **IMPORTANT NOTEs**
	 * 1. As of Nov 2021, only HDB-VC service requires their bookings to be piped to LifeSG, hence we did a hardcode such that all bookings with service level setting mqSubscriber to {lifesg} will be piped to LifeSG as a HDB-VC booking: `lifeSGMQService.send(...., AppointmentAgency.HDBVC_BSG)`
	 * In future when we have other organisations who wants their booking to be piped to LifeSG, we will have to remove this hardcode, else their bookings will still be piped to LifeSG as HDB-VC booking.
	 *
	 * 2. When comes to rescheduling, things gets a little more complicated because BSG bookings might have pending status, but LifeSG side does not cater to an pending status.
	 * Currently not an issue because we only have 1 use case: HDB-VC, and HDB-VC is auto accept flow, so their bookings will never become pending even when rescheduled by citizens
	 * In future when we have pending bookings to be sent to LifeSG, BSG and LifeSG will have to sit down again to discuss how to handle pending bookings
	 */
	public async update(subject: ISubject<any>): Promise<void> {
		if (
			subject instanceof BookingsSubject &&
			subject.booking.service?.mqSubscriber.includes(MqSubscriberType.LifeSG) &&
			!!subject.booking.videoConferenceUrl &&
			// tslint:disable-next-line: no-in-misuse
			[BookingStatus.Accepted, BookingStatus.Cancelled].includes(subject.booking.status)
		) {
			this.lifeSGMQSerivce.send(
				LifeSGMapper.mapLifeSGAppointment(
					subject.booking,
					subject.bookingType,
					subject.action,
					// NOTE: Hardcoded to HDBVC_BSG to complete the HDB-VC requirements in time. This needs to be revisited when other agencies wants to pipe data to LifeSG
					AppointmentAgency.HDBVC_BSG,
				),
				subject.action,
			);
		}
	}
}
