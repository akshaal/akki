import 'reflect-metadata';
import { App } from './app/App';
import { CustomAppModule } from './CustomAppModule';

/**
 * Top-level application class that is used to instantiate the whole application.
 * The class can be used to override startup behavior of the application just by overriding fine grained methods
 * of the App superclass..
 * This file will stay unchanged on the master branch of the application.
 * The main purpose of the file is to provide an installation-specific behavior or configuration
 * in a private branch/fork in such a way that makes it possible to have conflicts-free merges
 * from the upstream version into the branch/fork.
 *
 * @see CustomAppModule
 */
class CustomApp extends App {
    public constructor() {
        super(CustomAppModule);
    }
}

new CustomApp().run();
