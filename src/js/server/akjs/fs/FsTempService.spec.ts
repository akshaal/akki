/* eslint-disable @typescript-eslint/require-await */
import { expect } from 'chai';
import 'reflect-metadata';
import * as fs from 'fs';
import { FsTempService } from './FsTempService';

describe('FsTempService', () => {
    const fsTempService = new FsTempService();

    it('make sure that withTempDirectory is different on each invocation', async () => {
        let dir1 = '';
        let dir2 = '';

        await fsTempService.withTempDirectory('akki-test', async (dir) => {
            dir1 = dir;
        });

        await fsTempService.withTempDirectory('akki-test', async (dir) => {
            dir2 = dir;
        });

        expect(dir1).not.deep.equal(dir2);
    });

    it('make sure directory exists and secure in callback to withTempDirectory, but removed upon finish', async () => {
        let d = '';

        await fsTempService.withTempDirectory('akki-test', async (dir) => {
            d = dir;
            const stat = fs.statSync(dir);
            expect(stat.mode & fs.constants.S_IRWXG).to.be.equal(0);
            expect(stat.mode & fs.constants.S_IRWXO).to.be.equal(0);
            expect(stat.mode & fs.constants.S_IRWXU).to.not.be.equal(0);
            expect(stat.isDirectory()).to.be.equal(true);
        });

        expect(() => fs.statSync(d)).to.throw('ENOENT');
    });
});
