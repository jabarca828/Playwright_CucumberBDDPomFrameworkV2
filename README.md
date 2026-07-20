# Playwright + Cucumber BDD Automation Framework

An end-to-end UI test automation framework built with **Playwright**, **Cucumber (BDD)**, and **TypeScript**. It tests two pages of [webdriveruniversity.com](https://webdriveruniversity.com/): the **Login** page and the **Contact Us** page.

This README explains how the pieces fit together, so you can navigate the codebase confidently even if you're new to it.

---

## 1. The Big Idea, in Plain English

Instead of writing tests as raw code like `click(this button)`, this framework lets you write tests as **plain-English sentences** (Gherkin), for example:

```gherkin
Given I navigate to WebdriverUniversity homepage
When I click on the Contact Us button
And I type a first name
Then I should be presented with a successful contact us submission message
```

Behind the scenes, each sentence is mapped to a small piece of TypeScript code that tells Playwright what to actually do in the browser. This is the **BDD (Behavior-Driven Development)** approach — tests read like a specification anyone can understand, not just developers.

On top of that, the framework uses the **Page Object Model (POM)** — each web page (Home, Login, Contact Us) gets its own class describing the elements and actions available on that page. This keeps "what a page can do" separate from "what a test says," so if a button's selector changes, you fix it in one place instead of everywhere.

**In short: Feature files describe *what* the test does → Step definitions translate that into *actions* → Page objects perform the *actual browser interactions*.**

---

## 2. Folder Structure at a Glance

```
Playwright_CucumberBDDPomFramework/
├── env/
│   ├── .env                       # Real, local-only config (gitignored)
│   └── .env.example               # Template showing required variables (committed)
├── src/
│   ├── config/
│   │   └── env.ts                 # Single, typed source of truth for all env config
│   ├── features/                  # Plain-English test scenarios (Gherkin)
│   │   ├── Login.feature
│   │   └── Contact_Us.feature
│   ├── step-definitions/          # Glue code: maps feature file sentences → actions
│   │   ├── Base_Steps.ts
│   │   ├── Homepage_Steps.ts
│   │   ├── LoginPage_Steps.ts
│   │   ├── ContactUs_Steps.ts
│   │   ├── hooks/                 # Setup/teardown logic (before & after each test)
│   │   │   ├── hooks.ts
│   │   │   └── browserContextFixture.ts
│   │   └── world/
│   │       └── CucumberWorld.ts   # Shared "state" object passed between steps
│   ├── page-objects/              # One class per web page
│   │   ├── base/
│   │   │   ├── BasePage.ts        # Shared behavior all pages inherit
│   │   │   └── PageManager.ts     # Factory that creates page objects
│   │   ├── HomePage.ts
│   │   ├── LoginPage.ts
│   │   └── ContactUsPage.ts
│   ├── logger/
│   │   └── logger.ts              # Console logging (colored, leveled)
│   ├── utils/
│   │   ├── cucumber-timeout.ts    # Global Cucumber step timeout
│   │   └── playwright-timeouts.ts # Global Playwright navigation/command timeouts
│   └── index.ts                   # Custom CLI runner — pick a test "profile" to run
├── reports/                       # HTML/JSON test reports + failure screenshots
├── playwright.config.ts           # Playwright Test runner scaffold — not used by this suite (see note below)
├── package.json                   # Scripts & dependencies
└── tsconfig.json                  # TypeScript compiler settings
```

> **Note:** This project runs on the **Cucumber test runner**, not the native Playwright Test runner. `playwright.config.ts` is leftover from the default `npm init playwright` scaffold and isn't used by the Cucumber scripts — see [Section 8](#8-a-couple-of-things-worth-knowing).

---

## 3. How a Test Actually Runs (Step by Step)

Let's trace **one scenario** from the Contact Us feature all the way down:

```gherkin
Scenario: Valid Contact Us Form Submission
    Given I navigate to WebdriverUniversity homepage
    When I click on the Contact Us button
    And I switch to a new browser tab
    And I type a first name
    ...
    Then I should be presented with a successful contact us submission message
```

1. **Cucumber reads the `.feature` file** and finds the plain-English steps.
2. **Before the scenario starts**, a `Before` hook (in `hooks.ts`) runs:
   - Reads config from `appConfig` (browser choice, headless mode, viewport size)
   - Launches a browser (Chromium/Firefox/Webkit)
   - Opens a new browser context (an isolated session — its own cookies/cache)
   - Creates a `PageManager`, which builds fresh `HomePage`, `LoginPage`, `ContactUsPage` objects for this scenario
3. **Cucumber matches each Gherkin line to a step definition** — a TypeScript function with a matching string pattern (e.g. `Given('I navigate to WebdriverUniversity homepage', ...)`).
4. **Each step definition calls a method on a page object**, e.g. `this.homePage.clickOnContactUsButton()`, which internally does `this.waitAndClickByRole("link", "Contact Us Form")`.
5. **The page object talks to Playwright**, which drives the real browser.
6. **After the scenario finishes**, an `After` hook runs:
   - If the test failed, it takes a screenshot and attaches it to the report
   - Closes the page and the browser

This same pattern repeats for every scenario in both feature files.

---

## 4. The Key Building Blocks Explained

### `config/env.ts` — Single source of truth for configuration
Every environment variable in the project is read **once**, in this one file, with sensible defaults and validation baked in:

```ts
export const appConfig = {
    webdriverUniversityUrl: required('WEBDRIVER_UNIVERSITY_URL'),
    browser: optional('UI_AUTOMATION_BROWSER', 'chromium'),
    headless: optional('HEADLESS', 'false').toLowerCase() === 'true',
    // ...timeouts, viewport size, log level, etc.
} as const;
```

- `required(key)` throws a clear, immediate error (`Missing required environment variable: ...`) if something critical is missing from `.env` — instead of silently returning `undefined` and failing confusingly several steps later.
- `optional(key, fallback)` provides a safe default when a variable isn't set.
- Every other file in the project imports `appConfig` from here rather than reading `process.env` or calling `dotenv` itself. This means there's exactly **one place** to add, rename, or validate a new environment variable.

### `features/` — What to test (Gherkin)
Written in Gherkin syntax (`Given`/`When`/`Then`). Non-technical stakeholders can read these and understand exactly what's being tested, even without knowing TypeScript.

Tags like `@smoke`, `@regression`, `@random`, `@examples` mark scenarios so you can run a specific subset (more on this in [Section 6](#6-running-tests-the-tag-profile-system)).

### `step-definitions/` — How to translate English into actions
Each `.ts` file here contains functions decorated with `Given`, `When`, or `Then` from Cucumber. Cucumber matches these against the sentences in the feature files using either exact text or placeholders like `{string}` and `{int}` (for parameterized steps like `Scenario Outline`s).

These functions don't contain low-level Playwright code directly — they simply call methods on the relevant page object, keeping step definitions thin and readable.

### `page-objects/` — What each page can do
This is the **Page Object Model**. Every page of the website under test gets a class:

- **`BasePage`** — shared functionality every page needs: navigating to a URL, clicking things by role/selector, switching to a new browser tab. All other page objects `extend` this class, inheriting these helpers for free. `waitAndClick` properly waits for an element to become visible (via `locator.waitFor({ state: 'visible' })`) before clicking it.
- **`HomePage` / `LoginPage` / `ContactUsPage`** — page-specific actions only. E.g. `ContactUsPage` knows how to fill in the first name field, submit the form, and read back the success/error message.
- **`PageManager`** — a small factory that creates instances of each page object. Both the `Before` hook and `CucumberWorld` use it to build a fresh, ready-to-use set of page objects for every scenario.

### `world/CucumberWorld.ts` — Shared state per scenario
Cucumber gives every scenario its own "**World**" — an object that step definitions can attach data to via `this`. This project extends that World to:
- Hold instances of the page objects (so any step file can call `this.contactUsPage.fillFirstName(...)`)
- Store scenario-scoped data — URL, first/last name, email address, and the browser's `alert` dialog text — via simple getter/setter methods (`setAlertText` / `getAlertText`, etc.)

Because a **new** `CucumberWorld` is created for every scenario, none of this state can leak between tests — each scenario starts with a clean slate.

### `hooks/` — Setup and teardown
- **`browserContextFixture.ts`** — a tiny shared object holding the *current* Playwright `page` and `context`. Because a new browser tab means a new `Page` object, this fixture is how the rest of the framework always references "whichever tab is currently active."
- **`hooks.ts`** — the real setup/teardown logic, driven entirely by `appConfig`:
  - `Before`: launches the configured browser, opens a context/page, builds page objects
  - `After`: takes a screenshot on failure, closes the browser
  - `BeforeAll` / `AfterAll`: simple console logging around the whole suite

### `logger/logger.ts` — Readable console output
A [Winston](https://github.com/winstonjs/winston) logger configured to color-code messages by level (`info` green, `warn` yellow, `error` red) and prefix them with a timestamp. Log level is driven by `appConfig.logLevel`.

### `utils/` — Global timeout configuration
Two separate timeout systems have to be configured because two different tools are running the show:
- **`cucumber-timeout.ts`** — how long Cucumber will wait for a *single step* to finish before it times out.
- **`playwright-timeouts.ts`** — how long Playwright itself waits for page navigations and individual commands (clicks, fills, etc.).

Both now pull their values from `appConfig` rather than parsing `.env` independently. The important gotcha remains: **the Cucumber step timeout must always be set higher** than the Playwright command/navigation timeouts, otherwise Cucumber could kill a step before Playwright even gets a chance to time out gracefully.

### `index.ts` — The custom test-run launcher
Rather than running `cucumber-js` directly with a long list of flags, this script builds that command for you based on a "profile" name passed on the command line (see below), and also writes JSON + HTML reports automatically.

---

## 5. Environment Configuration (`.env`)

All environment-specific settings live in `env/.env`, are loaded once via `dotenv`, and are exposed through `appConfig` (see [Section 4](#4-the-key-building-blocks-explained)):

| Variable | Purpose |
|---|---|
| `WEBDRIVER_UNIVERSITY_URL` | Base URL under test — **required**, throws at startup if missing |
| `UI_AUTOMATION_BROWSER` | Which browser to launch: `chromium`, `firefox`, or `webkit` |
| `HEADLESS` | Run browser headless or with a visible UI (accepts `true`/`false`, case-insensitive) |
| `BROWSER_WIDTH` / `BROWSER_HEIGHT` | Viewport size, applied on launch and on every new tab |
| `PARALLEL` | Number of parallel Cucumber workers |
| `RETRY` | Number of automatic retries for failed scenarios |
| `LOG_LEVEL` | Winston logger verbosity (`info`, `warn`, `error`) |
| `UI_AUTOMATION_NAVIGATION_TIMEOUT` | Max wait time for page navigations |
| `UI_AUTOMATION_COMMAND_TIMEOUT` | Max wait time for individual Playwright commands |
| `CUCUMBER_CUSTOM_TIMEOUT` | Max wait time per Cucumber step (must stay higher than the two above) |

### First-time setup

`env/.env` is **gitignored** and never committed — it's local to your machine. To get set up:

```bash
cp env/.env.example env/.env
```

Then edit `env/.env` with any values specific to your machine or environment. `env/.env.example` is committed to the repo and documents every variable the project expects, with safe defaults — it's the reference copy, not the real config.

---

## 6. Running Tests: the Tag & Profile System

Scenarios are tagged in the feature files (`@smoke`, `@regression`, `@random`, `@examples`, `@login`, `@contactus`, `@specific`). `index.ts` maps each profile name to a Cucumber `--tags` filter:

| Profile        | Runs scenarios tagged... |
|----------------|---------------------------|
| `smoke`        | `@smoke` |
| `regression`   | `@regression` |
| `random`       | `@random` |
| `examples`     | `@examples` (Scenario Outlines with data tables) |
| `login`        | `@login` |
| `contactus`    | `@contactus` |
| `specific`     | `@specific` (hard-coded specific test data) |

You run a profile with:

```bash
npx ts-node ./src/index.ts smoke
npx ts-node ./src/index.ts regression
```

This resolves to a full `cucumber-js` command with the correct `--tags` filter, plus JSON/HTML reporting to the `reports/` folder.

There are also two simpler `package.json` scripts:

```bash
npm run cucumber           # runs cucumber-js, then executes src/index.ts
npm run cucumberWithTS     # runs only @smoke scenarios, via ts-node directly
```

> **Note:** These are run with `npm run <script-name>`, not `npx run <script-name>` — `npx` executes standalone packages by name, while `npm run` looks up scripts defined in `package.json`. Using `npx run` will fail, since it tries to fetch an unrelated npm package called `run`.

`precucumber` runs automatically before `cucumber` and clears out the old `reports/` folder so each run starts fresh.

---

## 7. Reports & Failure Diagnostics

Every run writes to `reports/`:
- `report.html` / `report.json` — full scenario/step results
- `reports/screenshots/` — automatically captured screenshots for any **failed** scenario, attached via Cucumber's `attach()` so they also show up embedded in the HTML report

This is handled entirely by the `After` hook in `hooks.ts` — no manual screenshot code needed in your step definitions.

---

## 8. A Couple of Things Worth Knowing

- **`playwright.config.ts` isn't used by this suite.** It's the default file created when Playwright is scaffolded (`npm init playwright`), but this project's actual test execution goes through Cucumber (`index.ts` / `npm run cucumber`), not `npx playwright test`. It's harmless to leave, but worth knowing so you don't wonder why editing it doesn't change your Cucumber runs.
- **Data in the demo scenarios is intentionally fixed in places** — e.g. the base "type a first name" step always fills `"Joe"`. This is fine for a demo/portfolio project, but worth knowing if you're wondering why the "default" scenario always uses identical data — the `@random` and `@examples` tagged scenarios exist specifically to exercise varied data.

---

## 9. Quick Reference: File → Purpose

| File | Purpose |
|---|---|
| `src/config/env.ts` | Single typed source of truth for all environment configuration |
| `src/features/*.feature` | Plain-English test scenarios |
| `src/step-definitions/*.ts` | Glue between Gherkin steps and page object actions |
| `src/step-definitions/hooks/hooks.ts` | Browser launch/teardown, screenshot-on-failure |
| `src/step-definitions/hooks/browserContextFixture.ts` | Holds reference to the currently active tab |
| `src/step-definitions/world/CucumberWorld.ts` | Per-scenario shared state & page object instances |
| `src/page-objects/base/BasePage.ts` | Shared page actions (navigate, click, switch tabs) |
| `src/page-objects/base/PageManager.ts` | Factory for creating page objects |
| `src/page-objects/*.ts` | Page-specific actions/selectors |
| `src/logger/logger.ts` | Colored console logging |
| `src/utils/cucumber-timeout.ts` | Cucumber step timeout |
| `src/utils/playwright-timeouts.ts` | Playwright navigation/command timeouts |
| `src/index.ts` | CLI entry point — runs a named test profile |
| `env/.env` | Real, local environment configuration (gitignored) |
| `env/.env.example` | Committed template documenting required variables |
| `reports/` | Generated HTML/JSON reports + failure screenshots |
