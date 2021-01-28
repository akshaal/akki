/* eslint-disable @typescript-eslint/ban-types */
import { expect } from 'chai';
import { hasProperty } from './hasProperty';

describe('hasProperty', () => {
    it('should match an object with property and cast the type accordingly', () => {
        const a: unknown = { x: 123 };

        expect(hasProperty(a, 'y')).to.be.equal(false);
        expect(hasProperty(a, 'x')).to.be.equal(true);

        if (hasProperty(a, 'x')) {
            expect(a.x).to.be.equal(123);
        }
    });

    it('should survive nulls and undef', () => {
        const a: unknown = undefined;
        const b: unknown = null;

        expect(hasProperty(a, 'y')).to.be.equal(false);
        expect(hasProperty(b, 'x')).to.be.equal(false);
    });
});
