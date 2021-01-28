import { Injectable } from 'injection-js';

@Injectable()
export class DateService {
    /**
     * Returns current date object.
     */
    public getCurrentDate(): Date {
        return new Date();
    }
}
