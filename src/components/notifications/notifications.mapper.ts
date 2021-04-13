import { Service, ServiceProvider} from '../../models';
import { DateHelper } from '../../infrastructure/dateHelper';
import {BookingStatusDisplayedInEmails} from "../../models/bookingStatus";

class EmailData {
	public status: string;
	public serviceName: Service;
	public serviceProviderName: ServiceProvider;
	public serviceProviderText: string;
	public location: string;
	public locationText: string;
	public day: string;
	public time: string;
}

export const emailMapper = (data): EmailData => {
	const status = BookingStatusDisplayedInEmails[data._booking._status];
	const serviceName = data._booking._service?._name || '';
	const serviceProviderName = data._booking._serviceProvider?._name;
	const serviceProviderText = serviceProviderName ? ` - ${serviceProviderName}` : '';
	const location = data._booking._location;
	const locationText = location ? `${location}` : '';
	const day = DateHelper.getDateFormat(data._booking._startDateTime);
	const time = `${DateHelper.getTime12hFormatString(data._booking._startDateTime)} - ${DateHelper.getTime12hFormatString(
		data._booking._endDateTime,
	)}`;
	return {
		status,
		serviceName,
		serviceProviderName,
		serviceProviderText,
		location,
		locationText,
		day,
		time,
	};
};
