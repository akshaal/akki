import { expect } from 'chai';
import { ContainerDescription } from './ContainerDescription';
import { InjectionToken } from './InjectionToken';
import { Token } from './Token';
import { TokenDescription } from './TokenDescription';

describe('ContainerDescription', () => {
    it('should not initialize tokenDescriptionMap until its first use', () => {
        const moduleNames: string[] = [];
        const tokenDescriptions: TokenDescription[] = [];
        const containerDescription = new ContainerDescription(tokenDescriptions, moduleNames);

        moduleNames.push('a');
        moduleNames.push('b');

        const desc1: TokenDescription = {
            name: 'x1',
            token: new InjectionToken<string>('a'),
            bootstrap: false,
            multi: true,
            moduleNames: ['xxx'],
        };

        const desc2: TokenDescription = {
            name: 'y2',
            token: new InjectionToken<string>('ee'),
            bootstrap: true,
            multi: true,
            moduleNames: ['d'],
        };

        tokenDescriptions.push(desc1);
        tokenDescriptions.push(desc2);

        expect(containerDescription.moduleNames).to.be.deep.equal(['a', 'b']);

        expect(containerDescription.tokenDescriptions).to.be.deep.equal([desc1, desc2]);

        const m = new Map<Token<unknown>, TokenDescription>();
        m.set(desc1.token, desc1);
        m.set(desc2.token, desc2);

        expect(containerDescription.tokenDescriptionMap).to.be.deep.equal(m);
    });
});
