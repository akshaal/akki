import { Injectable } from 'injection-js';
import { KlipperProtocolService } from './KlipperProtocolService';

@Injectable()
export class KlipperService {
    public constructor(klipperProtocolService: KlipperProtocolService) {}
}
