import { Page, Locator } from "@playwright/test";
import { pageFixture } from "../../step-definitions/hooks/browserContextFixture";
import { appConfig } from "../../config/env";

export class BasePage {
    get page(): Page {
        return pageFixture.page;
    }

    public async navigate(url: string): Promise<void> {
        await this.page.goto(url);
    }

    public async waitAndClickByRole(role: string, name: string): Promise<void> {
        const element = await this.page.getByRole(role as any, { name: name });
        await element.click();
    }

    public async waitAndClick(locator: Locator): Promise<void> {
        await locator.waitFor({ state: 'visible' });
        await locator.click();
    }

    public async waitAndClickSelector(selector: string): Promise<void> {
        await this.page.waitForSelector(selector);
        await this.page.click(selector);
    }

    public async switchToNewTab(): Promise<void> {
        await this.page.context().waitForEvent("page");

        const allPages = await this.page.context().pages();
        pageFixture.page = allPages[allPages.length - 1];

        await this.page.bringToFront();
        await this.page.setViewportSize({ width: appConfig.browserWidth, height: appConfig.browserHeight });
    }
}