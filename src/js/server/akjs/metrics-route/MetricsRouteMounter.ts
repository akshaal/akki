import { IRouter } from 'express';
import { register } from 'prom-client';
import { Injectable } from 'injection-js';
import { RouteMounter } from '../express/RouteMounter';
import { MetricsService } from '../metrics/MetricsService';

@Injectable()
export class MetricsRouteMounter extends RouteMounter {
    public constructor(private readonly _metricsService: MetricsService) {
        super();
    }

    public mountOnRouter(router: IRouter): void {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        router.get('/metrics', async (_, res) => {
            res.set('Content-Type', register.contentType);
            res.end(await this._metricsService.getMetrics());
        });
    }
}
