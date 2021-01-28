import { expect } from 'chai';
import { Inject, Injectable } from 'injection-js';
import { instance, mock, verify, when } from 'ts-mockito';
import { AkModule } from '../container/AkModule';
import { ContainerBuilder } from '../container/ContainerBuilder';
import { EnvToken } from './EnvToken';
import { EnvTokenResolver } from './EnvTokenResolver';

const ENV_TOKEN_X = new EnvToken({ id: 'AKJS_TEST_ENV_TOKEN_X', description: '', defaultValue: 'def' });

@Injectable()
class Tester {
    public constructor(@Inject(ENV_TOKEN_X) public v: string) {}
}

describe('EnvToken', () => {
    it('should have reasonable toString() method', () => {
        expect(new EnvToken({ id: 'xxx', description: '<<<<', defaultValue: 'a' }).toString()).to.equal('EnvToken xxx');
    });

    it('has convenient way to declare a provider that will use EnvTokenResolve to resolve the value', async () => {
        const envTokenResolverMock = mock<EnvTokenResolver>();
        const envTokenResolver = instance(envTokenResolverMock);

        when(envTokenResolverMock.resolve(ENV_TOKEN_X)).thenReturn('vvvv');

        const container = await new ContainerBuilder(
            new AkModule('test', (defs) =>
                defs
                    .withValue({ provide: EnvTokenResolver, useValue: envTokenResolver })
                    .with(Tester)
                    .withFactory(ENV_TOKEN_X.asFactoryProvider()),
            ),
        ).finishConstruction();

        expect(container.injector.get(Tester).v).to.equal('vvvv');
        verify(envTokenResolverMock.resolve(ENV_TOKEN_X)).once();
    });
});
