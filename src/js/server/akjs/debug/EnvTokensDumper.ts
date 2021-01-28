import { Injectable } from 'injection-js';
import { ContainerDescription } from '../container/ContainerDescription';
import { Injector } from '../container/Injector';
import { OnBootstrapPostConstruct } from '../container/OnBootstrapPostConstruct';
import { EnvToken } from '../core/EnvToken';
import { EnvTokenResolver } from '../core/EnvTokenResolver';
import { Logger } from '../core/Logger';

@Injectable()
export class EnvTokensDumper implements OnBootstrapPostConstruct {
    public constructor(
        private readonly _containerDescription: ContainerDescription,
        private readonly _injector: Injector,
        private readonly _logger: Logger,
        private readonly _envResolver: EnvTokenResolver,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async onBootstrapPostConstruct(): Promise<void> {
        if (!this._logger.isDebugEnabled()) {
            return;
        }

        const envTokens = this._containerDescription.tokenDescriptions
            .map((td) => td.token)
            .filter((t): t is EnvToken => t instanceof EnvToken);

        envTokens.sort((a, b) => a.id.localeCompare(b.id));

        const logMsg = envTokens
            .map((token) => {
                const val = this._injector.get(token);
                const valEscaped = JSON.stringify(val);

                let type = '';

                if (val === token.defaultValue) {
                    type += ' (default)';
                }

                if (val === this._envResolver.resolve(token, 'NO-DEFAULT')) {
                    type += ' (from environment)';
                }

                if (type === '') {
                    const module =
                        this._containerDescription.tokenDescriptionMap.get(token)?.moduleNames.join(', ') ?? '???';
                    type = ` from module ${module}`;
                }

                return `    ${token.id}${type}: ${valEscaped}`;
            })
            .join('\n');

        this._logger.debug(`EnvTokens resolved as:\n${logMsg}`);
    }
}
