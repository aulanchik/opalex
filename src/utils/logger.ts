import { config } from '@/config/env';

export class Logger {
    private static colors = {
        reset: '\x1b[0m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
    };

    private static shouldLog(level: string): boolean {
        const levels = ['error', 'warn', 'info', 'debug'];
        const currentIndex = levels.indexOf(config.logLevel);
        const messageIndex = levels.indexOf(level);
        return messageIndex <= currentIndex;
    }

    static info(message: string) {
        if (this.shouldLog('info')) {
            console.log(`${this.colors.blue}[INFO] ${message}${this.colors.reset}`);
        }
    }

    static success(message: string) {
        if (this.shouldLog('info')) {
            console.log(`${this.colors.green}[SUCCESS] ${message}${this.colors.reset}`);
        }
    }

    static warn(message: string) {
        if (this.shouldLog('warn')) {
            console.log(`${this.colors.yellow}[WARN] ${message}${this.colors.reset}`);
        }
    }

    static error(message: string) {
        if (this.shouldLog('error')) {
            console.log(`${this.colors.red}[ERROR] ${message}${this.colors.reset}`);
        }
    }
}
