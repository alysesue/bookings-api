import {intersectsDateTimeSpan, intersectsSpan} from "../timeSpan";
import {TimeOfDay} from "../../models";

describe('Timespan tests', () => {
    it('should check if time intersects', () => {
        const startTime = {startTime: new TimeOfDay(), endTime: new TimeOfDay()};
        const endTime = {startTime: new TimeOfDay(), endTime: new TimeOfDay()};
        const result = intersectsSpan(startTime, endTime);

        expect(result).toBe(false);
    });

    it('should check if date and time intersects', () => {
        const dateSpan = {start: new Date(), end: new Date()};
        const newDate = new Date();
        const result = intersectsDateTimeSpan(dateSpan, newDate, newDate);

        expect(result).toBe(false)
    });
});