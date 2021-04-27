import { Injectable } from 'injection-js';
import { Logger } from 'server/akjs/core/Logger';
import { KlipperRequestOutcome } from './KlipperProtocolService';

@Injectable()
export class KlipperUtils {
    public constructor(private readonly _logger: Logger) {}

    public logFailedRequestOutcome(outcome: Exclude<KlipperRequestOutcome, { kind: 'result' }>): void {
        let msg: string;
        const details: Record<string, unknown> = { req: outcome.req };
        
        switch (outcome.kind) {
            case 'disconnected':
                msg = "Unable to send request to Klipper because Klipper's API endpoint is currently disconnected.";
                break;

            case 'error':
                msg = 'Request resulted in an error.';
                details['error'] = outcome.error;
                break;

            case 'no-reply':
                msg = `Unable to get reply for request: ${outcome.reason}`;
                break;
        }

        this._logger.error(msg, details);
    }
}
