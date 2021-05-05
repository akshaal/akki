import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';
import { KlipperProtocolService } from './KlipperProtocolService';

type Obj = Readonly<Record<string, unknown>>;

export type KlipperObjectsQuery = Readonly<Record<string, null | Array<string>>>;

@Injectable()
export class KlipperEndpointsService {
    public constructor(private readonly _klipperProtocolService: KlipperProtocolService) {}

    public subscribeObjects(objects: KlipperObjectsQuery): Observable<Obj> {
        // TODO: Cast result to one that contains status and eventtime
        return this._klipperProtocolService.subscribeKlipper({ method: 'objects/subscribe', params: { objects } });
    }
}
