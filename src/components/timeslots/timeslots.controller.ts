import { Controller, Get, Post, Route } from 'tsoa';
import {Timeslot} from "../../models/timeslot";

@Route('api/v1/timeslots')
export class TimeslotsController extends Controller {
    @Get('')
    public async getTimeslots(): Promise<Timeslot[]> {
        const data = await this.getTimeslots()
    }
}