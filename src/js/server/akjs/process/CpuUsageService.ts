import { Injectable } from 'injection-js';

@Injectable()
export class CpuUsageService {
    public get(): NodeJS.CpuUsage {
        return process.cpuUsage();
    }
}
