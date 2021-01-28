/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { Injectable } from 'injection-js';
import { HighResTime } from '../misc/HighResTime';

@Injectable()
export class TimeService {
    /**
     * Wrapper around process.hrtime.
     */
    elapsedHighResTimeSince(start: HighResTime): HighResTime {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return process.hrtime(start as [number, number]);
    }

    /**
     * Returns highly precise time. Useful for measuring intervals.
     */
    nowHighResTime(): HighResTime {
        return process.hrtime();
    }

    /**
     * Uptime of NodeJS process.
     * In seconds with fractions of a second...
     */
    uptime(): number {
        return process.uptime();
    }
}
