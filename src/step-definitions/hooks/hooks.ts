import { AfterAll, BeforeAll, Before, After, Status } from "@cucumber/cucumber";
import { chromium, firefox, webkit, Browser, BrowserType } from "@playwright/test"
import { pageFixture } from "./browserContextFixture";
import { PageManager } from "../../page-objects/base/PageManager";
import { setGlobalSettings } from "../../utils/playwright-timeouts";
import { appConfig } from "../../config/env";

//Create dictionary mapping browser names to their launch functions
const browsers: { [key: string]: BrowserType } = {
    'chromium': chromium,
    'firefox': firefox,
    'webkit': webkit
}
//Represents the browser instance (e.g., Chrome, Firefox) opened by Playwright
let browserInstance: Browser | null = null;

async function intializeBrowserContext(selectedBrowser: string): Promise<Browser> {
    const launchBrowser = browsers[selectedBrowser];
    if (!launchBrowser) {
        throw new Error(`Invalid browser selected: ${selectedBrowser}`)
    }
    return await launchBrowser.launch({ headless: appConfig.headless });
}

async function initializePage(): Promise<void> {
    if (!browserInstance) {
        throw new Error('Browser instance is null');
    }
    pageFixture.context = await browserInstance.newContext({
        ignoreHTTPSErrors: true
    });
    pageFixture.page = await pageFixture.context.newPage();
    setGlobalSettings(pageFixture.page);
    await pageFixture.page.setViewportSize({ width: appConfig.browserWidth, height: appConfig.browserHeight })
}

//BeforeAll hook: Runs once before all scenarios
BeforeAll(async function () {
    console.log("\nExecuting test suite...")
})

//AfterAll hook: Runs once after all scenarios
AfterAll(async function () {
    console.log("\nFinished execution of test suite...")
})

Before(async function () {
    try {
        browserInstance = await intializeBrowserContext(appConfig.browser);
        console.log(`Browser context initialized for:  ${appConfig.browser}`)
        await initializePage();

        this.pageManager = new PageManager();
        this.basePage = this.pageManager.createBasePage();
        this.homePage = this.pageManager.createHomePage();
        this.contactUsPage = this.pageManager.createContactUsPage();
    } catch (error) {
        console.error('Browser context intialization failed:', error)
    }
})

// After hook: Runs after each scenario
After(async function ({ pickle, result }) {
    if (result?.status === Status.FAILED) {
        if (pageFixture.page) {
            const screenshotPath = `./reports/screenshots/${pickle.name}-${Date.now()}.png`;
            const image = await pageFixture.page.screenshot({
                path: screenshotPath,
                type: 'png',
            });
            await this.attach(image, 'image/png');
        } else {
            console.error('pageFixture.page is undefined');
        }
    }
    if (browserInstance) {
        await pageFixture.page?.close();
        await browserInstance.close();
    }
})