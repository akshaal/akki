import { Injectable } from 'injection-js';
import { KlipperCommService } from './KlipperCommService';

@Injectable()
export class KlipperService {
    public constructor(klipperCommService: KlipperCommService) {}
}
