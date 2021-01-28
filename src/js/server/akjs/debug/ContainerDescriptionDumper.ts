import { Injectable } from 'injection-js';
import { ContainerDescription } from '../container/ContainerDescription';
import { OnBootstrapPostConstruct } from '../container/OnBootstrapPostConstruct';
import { Logger } from '../core/Logger';

@Injectable()
export class ContainerDescriptionDumper implements OnBootstrapPostConstruct {
    public constructor(
        private readonly _containerDescription: ContainerDescription,
        private readonly _logger: Logger,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async onBootstrapPostConstruct(): Promise<void> {
        if (!this._logger.isDebugEnabled()) {
            return;
        }

        const tokenInfosByModule = new Map<string, string[]>();
        this._containerDescription.tokenDescriptions.forEach((token) => {
            token.moduleNames.forEach((moduleName) => {
                if (!tokenInfosByModule.has(moduleName)) {
                    tokenInfosByModule.set(moduleName, []);
                }

                let tokenInfo = token.name;
                if (token.bootstrap) {
                    tokenInfo += ' [B]';
                }

                if (token.multi) {
                    tokenInfo += ' [M]';
                }

                tokenInfosByModule.get(moduleName)?.push(tokenInfo);
            });
        });

        const modulesInfoStr = this._containerDescription.moduleNames
            .map((moduleName) => {
                const tokenInfos = tokenInfosByModule.get(moduleName) ?? [];
                tokenInfos.sort();
                const tokensInfo = tokenInfos.length === 0 ? '<nothing>' : tokenInfos.join(', ');
                return `    ${moduleName}: ${tokensInfo}`;
            })
            .join('\n');

        this._logger.debug(
            `Modules are resolved in the following order and provided the following tokens:\n${modulesInfoStr}`,
        );
    }
}
