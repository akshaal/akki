import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Injectable } from 'injection-js';

@Injectable()
export class FsTempService {
    /**
     * Creates a temporary directory in a secure way. Runs given function and removes the directory and its content.
     */
    public async withTempDirectory<T>(base: string, fn: (dir: string) => Promise<T>): Promise<T> {
        const tmpDir = await fs.promises.realpath(os.tmpdir());
        const dir = await fs.promises.mkdtemp(tmpDir + path.sep + base);

        try {
            return await fn(dir);
        } finally {
            await fs.promises.rmdir(dir, { recursive: true });
        }
    }
}
