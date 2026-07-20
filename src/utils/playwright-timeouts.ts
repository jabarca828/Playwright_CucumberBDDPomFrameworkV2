import { Page } from "@playwright/test";
import { appConfig } from "../config/env";

export function setGlobalSettings(page: Page) {
    page.setDefaultNavigationTimeout(appConfig.navigationTimeout);
    page.setDefaultTimeout(appConfig.commandTimeout);
}

//MAKE SURE!!!!!!! - Cucumber timeouts value is always HIGHER!!!!!
