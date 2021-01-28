import { expect } from 'chai';
import { implementsOnBootstrapPostConstruct } from './OnBootstrapPostConstruct';

describe('implementsOnBootstrapPostConstruct', () => {
    it('should match an object with onBootstrapPostConstruct function and cast the type accordingly', () => {
        const a: unknown = { onBootstrapPostConstruct: () => 123 };

        expect(implementsOnBootstrapPostConstruct(a)).to.be.equal(true);

        if (implementsOnBootstrapPostConstruct(a)) {
            expect(a.onBootstrapPostConstruct()).to.be.equal(123);
        }
    });

    it('should survive nulls, undef and wrong objects', () => {
        const a: unknown = undefined;
        const b: unknown = null;
        const c: unknown = {};
        const d: unknown = { onBootstrapPostConstruct: 3 };

        expect(implementsOnBootstrapPostConstruct(a)).to.be.equal(false);
        expect(implementsOnBootstrapPostConstruct(b)).to.be.equal(false);
        expect(implementsOnBootstrapPostConstruct(c)).to.be.equal(false);
        expect(implementsOnBootstrapPostConstruct(d)).to.be.equal(false);
    });
});
