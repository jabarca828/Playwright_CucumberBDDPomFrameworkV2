import { config as loadEnv } from "dotenv";

const env = loadEnv({ path: './env/.env' });

function required(key: string): string {
    const value = env.parsed?.[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function optional(key: string, fallback: string): string {
    return env.parsed?.[key] ?? fallback;
}

export const appConfig = {
    webdriverUniversityUrl: required('WEBDRIVER_UNIVERSITY_URL'),

    browser: optional('UI_AUTOMATION_BROWSER', 'chromium'),
    headless: optional('HEADLESS', 'false').toLowerCase() === 'true',
    browserWidth: parseInt(optional('BROWSER_WIDTH', '1920')),
    browserHeight: parseInt(optional('BROWSER_HEIGHT', '1080')),

    logLevel: optional('LOG_LEVEL', 'info'),

    navigationTimeout: parseInt(optional('UI_AUTOMATION_NAVIGATION_TIMEOUT', '50000')),
    commandTimeout: parseInt(optional('UI_AUTOMATION_COMMAND_TIMEOUT', '30000')),
    cucumberTimeout: parseInt(optional('CUCUMBER_CUSTOM_TIMEOUT', '60000')),

    parallel: optional('PARALLEL', '1'),
    retry: optional('RETRY', '0'),
} as const;