import { Given, When, Then } from "@cucumber/cucumber";
import logger from '../logger/logger';
import { CucumberWorld } from "./world/CucumberWorld";
import { appConfig } from "../config/env";

Given('I navigate to WebdriverUniversity homepage', async function (this: CucumberWorld) {
    try {
        await this.homePage.navigate(appConfig.webdriverUniversityUrl);
        logger.info('Accessing URL: ' + appConfig.webdriverUniversityUrl);
        this.setUrl(appConfig.webdriverUniversityUrl);
    } catch (error: any) {
        logger.error('An error has occurred: ' + error.message);
    }
});

When('I click on the Contact Us button', async function (this: CucumberWorld) {
    await this.homePage.clickOnContactUsButton();
});

When('I click on the Login Portal button', async function (this: CucumberWorld) {
    await this.homePage.clickOnLoginPortalButton();
});