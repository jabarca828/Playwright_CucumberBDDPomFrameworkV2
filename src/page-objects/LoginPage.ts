import { BasePage } from "../page-objects/base/BasePage"

export class LoginPage extends BasePage {

    //Click Login Button
    public async clickLoginButton(): Promise<void> {
        const loginButton = await this.page.locator("#login-button");
        await loginButton.hover();
        await loginButton.click({ force: true });
    }

    public async fillUsername(username: string): Promise<void> {
        await this.page.getByRole('textbox', { name: 'Username' }).fill(username);

    }

    public async fillPassword(password: string): Promise<void> {
        await this.page.getByRole('textbox', { name: 'Password' }).fill(password);
    }
}

