import * as winston from 'winston';
import colors from '@colors/colors';
import { appConfig } from '../config/env';

//Define the custom format
const myFormat = winston.format.printf(({ level, message, timestamp }) => {
    let colorizedMessage = message;
    switch (level) {
        case 'error':
            colorizedMessage = colors.red(message as string);
            break;
        case 'warn':
            colorizedMessage = colors.yellow(message as string);
            break;
        case 'info':
            colorizedMessage = colors.green(message as string);
            break;
    }
    return `${timestamp} ${level}: ${colorizedMessage}`
});


//Create a logger instane
const logger = winston.createLogger({
    level: appConfig.logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        myFormat
    ),
    transports: [
        new winston.transports.Console()
    ]
})

export default logger;