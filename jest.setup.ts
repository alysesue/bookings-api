import 'reflect-metadata';
import * as moment from 'moment';
import 'moment-timezone';

const currentTimezone = moment.tz.guess();
process.env.TZ = currentTimezone;
moment.tz.setDefault(currentTimezone);
jest.setTimeout(10000);
jest.mock('./src/config/app-config');
