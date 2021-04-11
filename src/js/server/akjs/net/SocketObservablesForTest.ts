import { Subject } from 'rxjs';
import { SocketObservables } from './SocketObservables';

export class SocketObservablesForTest implements SocketObservables {
    public readonly error$ = new Subject<Error>();
    public readonly close$ = new Subject<boolean>();
    public readonly connect$ = new Subject<void>();
    public readonly drain$ = new Subject<void>();
    public readonly end$ = new Subject<void>();
    public readonly data$ = new Subject<Buffer>();
}
