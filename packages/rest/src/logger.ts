import { BootstrapperConfig } from '@flstk/rest/config';
import pino, { Logger, stdTimeFunctions } from 'pino';

type LogFn = {
    <T extends object>(obj: T, msg?: string, ...args: any[]): void;
    (msg: string, ...args: any[]): void;
};

export class AppLogger {
    private pino: Logger;

    public readonly fatal: LogFn;
    public readonly error: LogFn;
    public readonly warn: LogFn;
    public readonly info: LogFn;
    public readonly debug: LogFn;

    public constructor(config: BootstrapperConfig) {
        const prettyPrint = config.logging.prettyPrint
            ? {
                  colorize: true,
                  levelFirst: true,
                  suppressFlushSyncWarning: true,
              }
            : false;

        this.pino = pino({ prettyPrint, timestamp: stdTimeFunctions.isoTime });

        this.fatal = this.pino.fatal.bind(this.pino);
        this.error = this.pino.error.bind(this.pino);
        this.warn = this.pino.warn.bind(this.pino);
        this.info = this.pino.info.bind(this.pino);
        this.debug = this.pino.debug.bind(this.pino);
    }
}
