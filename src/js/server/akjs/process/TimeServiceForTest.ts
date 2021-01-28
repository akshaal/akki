import { Injectable } from 'injection-js';
import { HighResTime, highResTimeFromMilliseconds, subtractHighResTimes } from '../misc/HighResTime';
import { DateServiceForTest } from '../core/DateServiceForTest';
import { TimeService } from './TimeService';

@Injectable()
export class TimeServiceForTest extends TimeService {
    private _startMilliseconds: number = this._dateServiceForTest.currentSeconds;

    public constructor(private readonly _dateServiceForTest: DateServiceForTest) {
        super();
    }

    public markAsStart(): void {
        this._startMilliseconds = this._dateServiceForTest.currentMilliseconds;
    }

    // ------ Implementation of the TimeService methods

    public elapsedHighResTimeSince(start: HighResTime): HighResTime {
        return subtractHighResTimes(this.nowHighResTime(), start);
    }

    public nowHighResTime(): HighResTime {
        return highResTimeFromMilliseconds(this._dateServiceForTest.currentMilliseconds);
    }

    public uptime(): number {
        return (this._dateServiceForTest.currentMilliseconds - this._startMilliseconds) / 1000;
    }
}
