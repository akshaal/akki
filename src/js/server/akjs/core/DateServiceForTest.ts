import { Injectable } from 'injection-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { DateService } from './DateService';

@Injectable()
export class DateServiceForTest extends DateService {
    private _currentMilliseconds = 0;

    private readonly _currentMilliseconds$ = new BehaviorSubject<number>(this._currentMilliseconds);

    // ------------------ Methods to control and observe time in tests ----------------------

    /**
     * Hot observable that emits an event with current milliseconds time each time time changes....
     * (which changes discretely in tests)
     */
    public get currentMilliseconds$(): Observable<number> {
        return this._currentMilliseconds$;
    }

    public get currentMilliseconds(): number {
        return this._currentMilliseconds;
    }

    public get currentSeconds(): number {
        return this.currentMilliseconds / 1000;
    }

    public setMilliseconds(milliseconds: number): void {
        if (milliseconds < this._currentMilliseconds) {
            throw Error(
                `Can't go back in time, new milliseconds=${milliseconds}, current milliseconds=${this.currentMilliseconds}`,
            );
        }

        if (this._currentMilliseconds !== milliseconds) {
            this._currentMilliseconds$.next(milliseconds);
            this._currentMilliseconds = milliseconds;
        }
    }

    public setSeconds(seconds: number): void {
        this.setMilliseconds(seconds * 1000);
    }

    public addMilliseconds(milliseconds: number): void {
        if (milliseconds < 0) {
            throw Error(`Can't go back in time, milliseconds=${milliseconds}`);
        }

        this.setMilliseconds(this._currentMilliseconds + milliseconds);
    }

    public addSeconds(seconds: number): void {
        this.addMilliseconds(seconds * 1000);
    }

    // ------------------ Implementation of DateService ----------------------

    public getCurrentDate(): Date {
        return new Date(this._currentMilliseconds);
    }
}
