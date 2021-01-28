import { HostPort } from './HostPort';

export interface ProtoHostPort extends HostPort {
    readonly proto: string;
}
