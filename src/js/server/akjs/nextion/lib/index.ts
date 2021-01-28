/* istanbul ignore file */

import { Nextion } from './nextion';
import { UART } from './uart';

/**
 * Instantiates a Nextion instance and fulfills a Promise
 * when it's listening for data.
 * @param uart UART instance
 */
function instantiate(uart: UART): Promise<Nextion> {
    return new Promise((resolve) => {
        const nextion = new Nextion(uart, {}, () => {
            resolve(nextion);
        });
    });
}

/**
 * Simplified type-safe view over Nextion class.
 * Limits entire API to this subset so lib/* can be replaced with something simpler and better documented.
 * TODO: get rid of lib/*
 */
export interface NextionInterface {
    readonly isOpen: boolean;

    on(eventName: 'error', cbk: (error: unknown) => void): void;
    on(eventName: 'disconnected', cbk: () => void): void;
    on(eventName: 'touchEvent', cbk: (data: { readonly releaseEvent: boolean }) => void): void;

    setValue(name: string, value: string | number): Promise<void>;

    close(): Promise<void>;
}

/**
 * Create a Nextion instance.
 * @param port Name of port (`COM1`, `/dev/tty.usbserial`, etc.), `Serialport` instance or `Duplex` stream.  Omit for autodetection.
 * @returns {Promise<Nextion>} - Nextion instance
 */
export const openNextionPort = (port: string): Promise<NextionInterface> => UART.from(port).then(instantiate);
