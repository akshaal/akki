import { AkModule } from '../akjs/container/AkModule';
import { ExpressAppModule } from '../akjs/express-app/ExpressAppModule';
import { NextionModule } from '../akjs/nextion/NextionModule';
import { DisplayManager } from './DisplayManager';
import { KlipperModule } from './klipper/KlipperModule';

// Don't modify this module unless you don't care about merge conflict with upstream / master branch.
// Customization is supposed to be done using ./index.ts or CustomAppModule.ts.

export const AppModule = new AkModule('app', [ExpressAppModule, NextionModule, KlipperModule], (defs) =>
    defs.bootstrap(DisplayManager),
);
