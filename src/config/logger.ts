import { LoggerV2 } from 'mol-lib-common';

export const emailLogger = LoggerV2.create({ featureName: 'email' });
export const smsLogger = LoggerV2.create({ featureName: 'sms' });
