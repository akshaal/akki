import { expect } from 'chai';
import { AkModule } from './AkModule';

class A {
    public a = 0;
}

class B {
    public b = 0;
}

class C {
    public c = 0;
}

class D extends C {
    public d = 0;
}

class E {
    public e = 0;
}

class F extends E {
    public f = 0;
}

new AkModule('imp', (defs) =>
    defs
        // @ts-expect-error: incompatible types
        .withClass({ provide: A, useClass: B })
        // @ts-expect-error: incompatible types
        .withExisting({ provide: A, useExisting: B })
        // @ts-expect-error: incompatible types
        .withValue({ provide: A, useValue: new B() })
        // @ts-expect-error: incompatible types
        .withFactory({ provide: A, useFactory: () => new B() })
        // @ts-expect-error: incompatible types
        .bootstrapClass({ provide: A, useClass: B })
        // @ts-expect-error: incompatible types
        .bootstrapExisting({ provide: A, useExisting: B })
        // @ts-expect-error: incompatible types
        .bootstrapValue({ provide: A, useValue: new B() })
        // @ts-expect-error: incompatible types
        .bootstrapFactory({ provide: A, useFactory: () => new B() }),
);

describe('AkModule', () => {
    it('should properly handle empty definitions', () => {
        const m = new AkModule('mm');
        expect(m.name).to.be.equal('mm');
        expect(m.bootstrap).to.be.deep.equal([]);
        expect(m.imports).to.be.deep.equal([]);
        expect(m.providers).to.be.deep.equal([]);
    });

    it('should not flatten imports', () => {
        const mi = new AkModule('mi', (defs) => defs.with(A).bootstrap(B));

        const m = new AkModule('mm', [mi]);
        expect(m.name).to.be.equal('mm');
        expect(m.bootstrap).to.be.deep.equal([]);
        expect(m.imports).to.be.deep.equal([mi]);
        expect(m.providers).to.be.deep.equal([]);
    });

    it('should handle definitions', () => {
        const fact1 = { provide: A, useFactory: (): A => new A() };
        const fact2 = { provide: E, useFactory: (): E => new E() };
        const m = new AkModule('mi', (defs) =>
            defs
                .with(A)
                .withClass({ provide: C, useClass: D })
                .withExisting({ provide: A, useExisting: A })
                .withFactory(fact1)
                .withValue({ provide: A, useValue: new A() })
                .bootstrap(B)
                .bootstrapClass({ provide: E, useClass: F })
                .bootstrapExisting({ provide: E, useExisting: E })
                .bootstrapFactory(fact2)
                .bootstrapValue({ provide: E, useValue: new E() }),
        );

        expect(m.name).to.be.equal('mi');
        expect(m.imports).to.be.deep.equal([]);
        expect(m.providers).to.be.deep.equal([
            A,
            { provide: C, useClass: D },
            { provide: A, useExisting: A },
            fact1,
            { provide: A, useValue: new A() },
        ]);
        expect(m.bootstrap).to.be.deep.equal([
            B,
            { provide: E, useClass: F },
            { provide: E, useExisting: E },
            fact2,
            { provide: E, useValue: new E() },
        ]);
    });
});
