import { IRouter } from 'express';

export abstract class RouteMounter {
    /**
     * Configures router as needed and then returns human readable description of the configured route.
     * @param router express router.
     */
    abstract mountOnRouter(router: IRouter): void;
}
