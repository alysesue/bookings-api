import {intersectsDateTimeSpan, intersectsSpan} from "../timeSpan";
import {TimeOfDay} from "../../models";

describe('Timespan tests', () => {
    it('should check if time intersects', () => {
        const startTime = {startTime: TimeOfDay.create({hours: 9, minutes: 0}), endTime: TimeOfDay.create({hours: 10, minutes: 0})};
        const endTime = {startTime: TimeOfDay.create({hours: 10, minutes: 0}), endTime: TimeOfDay.create({hours: 11, minutes: 0})};
        const result = intersectsSpan(startTime, endTime);

        expect(result).toBe(false);
    });

    it('should check if datetime intersects where second time period starts and ends later than first period', () => {
        const dateSpan = {start: new Date('2020-07-28T01:00:00.000Z'), end: new Date('2020-07-28T02:00:00.000Z')};
        const startDate = new Date('2020-07-28T01:01:00.000Z');
        const endDate = new Date('2020-07-28T02:01:00.000Z');

        const result = intersectsDateTimeSpan(dateSpan, startDate, endDate);

        expect(result).toBe(true);
    });

    it('should check if datetime intersects where first time period starts and ends later than second period', () => {
        const dateSpan = {start: new Date('2020-07-28T01:01:00.000Z'), end: new Date('2020-07-28T02:01:00.000Z')};
        const startDate = new Date('2020-07-28T01:00:00.000Z');
        const endDate = new Date('2020-07-28T02:00:00.000Z');

        const result = intersectsDateTimeSpan(dateSpan, startDate, endDate);

        expect(result).toBe(true);
    });

    it('should check if datetime intersects where first time period starts and ends during second period', () => {
        const dateSpan = {start: new Date('2020-07-28T01:15:00.000Z'), end: new Date('2020-07-28T02:01:30.000Z')};
        const startDate = new Date('2020-07-28T01:00:00.000Z');
        const endDate = new Date('2020-07-28T02:00:00.000Z');

        const result = intersectsDateTimeSpan(dateSpan, startDate, endDate);

        expect(result).toBe(true);
    });

    it('should check if datetime intersects where second time period starts and ends during first period', () => {
        const dateSpan = {start: new Date('2020-07-28T01:00:00.000Z'), end: new Date('2020-07-28T02:00:00.000Z')};
        const startDate = new Date('2020-07-28T01:15:00.000Z');
        const endDate = new Date('2020-07-28T01:30:00.000Z');

        const result = intersectsDateTimeSpan(dateSpan, startDate, endDate);

        expect(result).toBe(true);
    });
});