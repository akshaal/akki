import { Injectable } from 'injection-js';
import { nanoid } from 'nanoid';

@Injectable()
export class NanoIdService {
    public generate(size?: number): string {
        return nanoid(size);
    }
}
