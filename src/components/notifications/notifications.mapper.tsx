import { Service, ServiceProvider } from '../../models';
import { DateHelper } from '../../infrastructure/dateHelper';

class EmailData {
	public status: string;
	public service: Service;
	public serviceProvider: ServiceProvider;
	public serviceProviderText: string;
	public email: string;
	public location: string;
	public locationText: string;
	public startDateTime: Date;
	public endDateTime: Date;
}

export const emailMapper = (data: EmailData) => {
	const status = data.status;
	const serviceName = data.service?.name || '';
	const serviceProviderName = data.serviceProvider?.name;
	const serviceProviderText = serviceProviderName ? `<b> - ${serviceProviderName}</b>` : '';
	const email = data.email;
	const location = data.location;
	const locationText = location ? `Location: <b>${location}</b>` : '';
	const day = DateHelper.getDateFormat(data.startDateTime);
	const time = `${DateHelper.getTime12hFormatString(data.startDateTime)} - ${DateHelper.getTime12hFormatString(
		data.endDateTime,
	)}`;
	return {
		status,
		serviceName,
		serviceProviderName,
		serviceProviderText,
		email,
		location,
		locationText,
		day,
		time,
	};
};
