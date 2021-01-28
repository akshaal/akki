import { Injectable } from 'injection-js';
import { LifecycleEvents } from '../core/LifecycleEvents';
import { MetricsService } from '../metrics/MetricsService';
import { highResTimeToSeconds } from '../misc/HighResTime';
import { CpuUsageService } from '../process/CpuUsageService';
import { TimeService } from '../process/TimeService';

@Injectable()
export class CpuMetricsService {
    public constructor(
        metricsService: MetricsService,
        lifecycleEvents: LifecycleEvents,
        timeService: TimeService,
        cpuUsageService: CpuUsageService,
    ) {
        lifecycleEvents.postConstruct$.subscribe(() => {
            const userGauge = metricsService.createGauge({
                name: 'akjs_process_cpu_user_pct',
                help: 'User CPU time by node process.',
            });

            const systemGauge = metricsService.createGauge({
                name: 'akjs_process_cpu_system_pct',
                help: 'System CPU time by node process.',
            });

            let lastCpuUsage = cpuUsageService.get();
            let lastCpuUsageHighResTime = timeService.nowHighResTime();

            metricsService.update$.pipe(lifecycleEvents.takeUntilDestroyed()).subscribe(() => {
                const elapsedSeconds = highResTimeToSeconds(
                    timeService.elapsedHighResTimeSince(lastCpuUsageHighResTime),
                );

                const cpuUsage = cpuUsageService.get();
                const userUsageMicros = cpuUsage.user - lastCpuUsage.user;
                const systemUsageMicros = cpuUsage.system - lastCpuUsage.system;

                lastCpuUsage = cpuUsage;

                userGauge.set((100 * userUsageMicros) / 1e6 / elapsedSeconds);
                systemGauge.set((100 * systemUsageMicros) / 1e6 / elapsedSeconds);

                lastCpuUsageHighResTime = timeService.nowHighResTime();
            });
        });
    }
}
