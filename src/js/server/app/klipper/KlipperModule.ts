import { AkModule } from 'server/akjs/container/AkModule';
import { NanoIdModule } from 'server/akjs/nanoid/NanoIdModule';
import { NetModule } from 'server/akjs/net/NetModule';
import { ENV_KLIPPER_API_RECONNECT_DELAY_MS, ENV_KLIPPER_API_UDS, KlipperCommService } from './KlipperCommService';
import { ENV_KLIPPER_API_MAX_INACTIVITY_MS, KlipperProtocolService } from './KlipperProtocolService';
import { KlipperBasicInfoService } from './KlipperBasicInfoService';
import { KlipperUtils } from './KlipperUtils';
import { KlipperEndpointsService } from './KlipperEndpointsService';

// Don't modify this module unless you don't care about merge conflict with upstream / master branch.
// Customization is supposed to be done using ./index.ts or CustomAppModule.ts.

export const KlipperModule = new AkModule('app.klipper', [NetModule, NanoIdModule], (defs) =>
    defs
        .withFactory(ENV_KLIPPER_API_UDS.asFactoryProvider())
        .withFactory(ENV_KLIPPER_API_MAX_INACTIVITY_MS.asFactoryProvider())
        .withFactory(ENV_KLIPPER_API_RECONNECT_DELAY_MS.asFactoryProvider())
        .with(
            KlipperCommService,
            KlipperProtocolService,
            KlipperBasicInfoService,
            KlipperUtils,
            KlipperEndpointsService,
        ),
);
