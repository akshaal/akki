import { expect } from 'chai';
import { AkModule } from './AkModule';
import { Container } from './Container';
import { ContainerBuilder } from './ContainerBuilder';

class A {
    public constructor(public readonly v: number) {}
}

class B {
    public constructor(public readonly v: number) {}
}

class C {
    public constructor(public readonly v: number) {}
}

describe('Injector', () => {
    let container: Container;

    before(async () => {
        const m = new AkModule('test', (defs) =>
            defs
                .withValue({ provide: A, useValue: new A(100) })
                .withValue({ provide: B, useValue: new A(5), multi: true })
                .withValue({ provide: B, useValue: new B(10), multi: true }),
        );

        container = await new ContainerBuilder(m).finishConstruction();
    });

    after(async () => {
        await container.shutdown();
    });

    it('must have get() method that returns a value for a regular token if it exists', () => {
        expect(container.injector.get(A)).to.be.deep.equal(new A(100));
    });

    it('must have get() method that throws exception for non-existing token', () => {
        expect(() => container.injector.get(C)).to.throw('No provider for C');
    });

    it('must have get() method that throws exception when getting multi-token', () => {
        expect(() => container.injector.get(B)).to.throw('Token is provided with multi-provider');
    });

    it('must have getMulti() method that returns values for a multi token if it exists', () => {
        expect(container.injector.getMulti(B)).to.be.deep.equal([new A(5), new B(10)]);
    });

    it('must have getMulti() method that throws exception for non-existing token', () => {
        expect(() => container.injector.getMulti(C)).to.throw('No provider for C');
    });

    it('must have getMulti() method that throws exception when getting regular token', () => {
        expect(() => container.injector.getMulti(A)).to.throw('Token is not provided with multi-provide');
    });

    it('must have pushInto() method that throws exception for non-existing token', () => {
        expect(() => {
            container.injector.pushInto([], C);
        }).to.throw('No provider for C');
    });

    it('must have pushInto() that support regular tokens', () => {
        const arr: (A | B)[] = [];
        container.injector.pushInto(arr, A);
        expect(arr).to.be.deep.equal([new A(100)]);
    });

    it('must have pushInto() that support multi tokens', () => {
        const arr: (A | B)[] = [];
        container.injector.pushInto(arr, B);
        expect(arr).to.be.deep.equal([new A(5), new B(10)]);
    });

    it('must have getAsArray() method that throws exception for non-existing token', () => {
        expect(() => container.injector.getAsArray(C)).to.throw('No provider for C');
    });

    it('must have getAsArray() method that returns a value for a regular token if it exists', () => {
        expect(container.injector.getAsArray(A)).to.be.deep.equal([new A(100)]);
    });

    it('must have getAsArray() method that returns values for a multi token if it exists', () => {
        expect(container.injector.getAsArray(B)).to.be.deep.equal([new A(5), new B(10)]);
    });
});
