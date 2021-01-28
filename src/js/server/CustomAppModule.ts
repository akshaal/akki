import { AkModule } from './akjs/container/AkModule';
import { AppModule } from './app/AppModule';

/**
 * Top-level module that is used to instantiate the whole application.
 * The module can be used to override any definition of the application.
 * This file will stay unchanged on the master branch of the application.
 * The main purpose of the file is to provide an installation-specific behavior or configuration
 * in a private branch/fork in such a way that makes it possible to have conflicts-free merges
 * from the upstream version into the branch/fork.
 *
 * @see CustomAppModule
 */
export const CustomAppModule = new AkModule('custom', [AppModule]);
