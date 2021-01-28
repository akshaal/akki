import { TokenDescription } from './TokenDescription';

export class ContainerDescription {
    private _tokenDescriptionMap?: Map<unknown, TokenDescription>;

    /**
     * Map from a token to its description.
     */
    public get tokenDescriptionMap(): Readonly<Map<unknown, TokenDescription>> {
        // Initialize on first use because 'tokenDescriptions' are populated not quite at moment of construction...
        if (this._tokenDescriptionMap === undefined) {
            this._tokenDescriptionMap = new Map(this.tokenDescriptions.map((desc) => [desc.token, desc]));
        }

        return this._tokenDescriptionMap;
    }

    /**
     * @param tokenDescriptions Descriptions for tokens provided in the container.
     * @param moduleNames name of module in order in which definitions were added into the injector (last definition wins)
     */
    public constructor(
        public readonly tokenDescriptions: Readonly<TokenDescription[]>,
        public readonly moduleNames: Readonly<string[]>,
    ) {}
}
