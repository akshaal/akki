/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { Injectable } from 'injection-js';
import { Observable } from 'rxjs';
import { KlipperProtocolService } from './KlipperProtocolService';

type UnpackArray<T> = T extends (infer R)[] ? R : never;

export type KlipperObjectsQuery = Readonly<Record<string, null | [...string[]]>>;
export type KlipperObjectsObservable<Q extends KlipperObjectsQuery> = Observable<{
    status: { [P in keyof Q]?: Q[P] extends null ? Record<string, unknown> : { [V in UnpackArray<Q[P]>]?: unknown } };
    eventtime: number;
}>;

@Injectable()
export class KlipperEndpointsService {
    public constructor(private readonly _klipperProtocolService: KlipperProtocolService) {}

    public subscribeObjects<Q extends KlipperObjectsQuery>(objects: Q): KlipperObjectsObservable<Q> {
        return this._klipperProtocolService.subscribeKlipper({
            method: 'objects/subscribe',
            params: { objects },
        }) as any;
    }
}
