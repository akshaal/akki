import { Injectable } from 'injection-js';

@Injectable()
export class MemoryUsageService {
    public get(): NodeJS.MemoryUsage {
        return process.memoryUsage();
    }
}
