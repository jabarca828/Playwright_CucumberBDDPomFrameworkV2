import { Given, When, Then } from "@cucumber/cucumber";
import { pageFixture } from "./hooks/browserContextFixture";
import { expect } from "@playwright/test"
import { faker } from "@faker-js/faker"
import { CucumberWorld } from "./world/CucumberWorld";

When('I click the login button', async function (this: CucumberWorld) {
    //Setting Alert before clicking Login so Javascript is prepared for it
    pageFixture.page.on("dialog", async (alert) => {
        this.setAlertText(alert.message());
        await alert.accept();
    })
    await this.loginPage.clickLoginButton();
})

Then('I should be presented with a failed message', async function (this: CucumberWorld) {
    expect(this.getAlertText()).toBe("validation failed");
})

Then('I should be presented with an alert text {string}', async function (this: CucumberWorld, expectedAlertText: string) {
    expect(this.getAlertText()).toBe(expectedAlertText);
})

//Random Data
When('I enter a random username', async function (this: CucumberWorld) {
    await this.loginPage.fillUsername(faker.internet.username());
});

When('I enter a random password', async function (this: CucumberWorld) {
    await this.loginPage.fillPassword(faker.internet.password())
});

//Scenario Outlines:
When('I enter a username {word}', async function (this: CucumberWorld, username: string) {
    await this.loginPage.fillUsername(username);
});

When('I enter a password {word}', async function (this: CucumberWorld, password: string) {
    await this.loginPage.fillPassword(password);
});