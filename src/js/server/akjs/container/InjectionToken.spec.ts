/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from 'chai';
import { InjectionToken } from './InjectionToken';

const x = new InjectionToken<string>('a');
const z = new InjectionToken<string>('a');

// @ts-expect-error like this one:
//  Type 'InjectionToken<string>' is not assignable to type 'InjectionToken<number>'.
//     Type 'string' is not assignable to type 'number'.
const y: InjectionToken<number> = x;

describe('InjectionToken', () => {
    it('should not be equal although having same name', () => {
        expect(x).not.to.equal(z);
    });
});
