import { expect } from 'chai';
import { implementsOnBootstrapPreDestroy } from './OnBootstrapPreDestroy';

describe('implementsOnBootstrapPreDestroy', () => {
    it('should match an object with onBootstrapPreDestroy function and cast the type accordingly', () => {
        const a: unknown = { onBootstrapPreDestroy: () => 123 };

        expect(implementsOnBootstrapPreDestroy(a)).to.be.equal(true);

        if (implementsOnBootstrapPreDestroy(a)) {
            expect(a.onBootstrapPreDestroy()).to.be.equal(123);
        }
    });

    it('should survive nulls, undef and wrong objects', () => {
        const a: unknown = undefined;
        const b: unknown = null;
        const c: unknown = {};
        const d: unknown = { onBootstrapPreDestroy: 3 };

        expect(implementsOnBootstrapPreDestroy(a)).to.be.equal(false);
        expect(implementsOnBootstrapPreDestroy(b)).to.be.equal(false);
        expect(implementsOnBootstrapPreDestroy(c)).to.be.equal(false);
        expect(implementsOnBootstrapPreDestroy(d)).to.be.equal(false);
    });
});
