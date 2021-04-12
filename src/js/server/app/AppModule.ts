import { NetModule } from 'server/akjs/net/NetModule';
import { AkModule } from '../akjs/container/AkModule';
import { ExpressAppModule } from '../akjs/express-app/ExpressAppModule';
import { NextionModule } from '../akjs/nextion/NextionModule';
import { DisplayManager } from './DisplayManager';
import { ENV_KLIPPER_API_RECONNECT_DELAY_MS, ENV_KLIPPER_API_UDS, KlipperCommService } from './KlipperCommService';
import { ENV_KLIPPER_API_MAX_INACTIVITY_MS, KlipperProtocolService } from './KlipperProtocolService';
import { KlipperService } from './KlipperService';

// Don't modify this module unless you don't care about merge conflict with upstream / master branch.
// Customization is supposed to be done using ./index.ts or CustomAppModule.ts.

export const AppModule = new AkModule('app', [ExpressAppModule, NextionModule, NetModule], (defs) =>
    defs
        .bootstrap(DisplayManager)
        .withFactory(ENV_KLIPPER_API_UDS.asFactoryProvider())
        .withFactory(ENV_KLIPPER_API_MAX_INACTIVITY_MS.asFactoryProvider())
        .withFactory(ENV_KLIPPER_API_RECONNECT_DELAY_MS.asFactoryProvider())
        .with(KlipperCommService, KlipperProtocolService, KlipperService),
);
