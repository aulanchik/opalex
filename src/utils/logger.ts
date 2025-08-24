export class Logger {
    private static colors = {
        reset: '\x1b[0m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
    };

    static info(message: string) {
        console.log(`${this.colors.blue}[INFO] ${message}${this.colors.reset}`);
    }

    static success(message: string) {
        console.log(`${this.colors.green}[SUCCESS] ${message}${this.colors.reset}`);
    }

    static warn(message: string) {
        console.log(`${this.colors.yellow}[WARN] ${message}${this.colors.reset}`);
    }

    static error(message: string) {
        console.log(`${this.colors.red}[ERROR] ${message}${this.colors.reset}`);
    }
}
