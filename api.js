const _URL = "https://www.messenger.com";
const _LOGIN_FORM_SELECTOR = "#login_form";
const _EMAIL_INPUT_SELECTOR = "#login_form #email";
const _PASSWORD_INPUT_SELECTOR = "#login_form #pass";
const _LOGIN_BUTTON_SELECTOR = "#loginbutton";

export async function login(page, email, password) {
    await page.goto(_URL);
    await page.waitForSelector(_LOGIN_FORM_SELECTOR);
    await page.waitForSelector(_EMAIL_INPUT_SELECTOR);
    await page.fill(_EMAIL_INPUT_SELECTOR, email);
    await page.waitForSelector(_PASSWORD_INPUT_SELECTOR);
    await page.fill(_PASSWORD_INPUT_SELECTOR, password);
    await page.waitForSelector(_LOGIN_BUTTON_SELECTOR);
    await page.click("button[data-cookiebanner='accept_button']");  // accept cookies ;)
    await page.click(_LOGIN_BUTTON_SELECTOR);
}

export async function getAllVisibleThreads(page) {
    await page.waitForSelector("div[role='gridcell']");
    const threads = await page.$$("div[role='gridcell'] a");
    return await Promise.all(threads.map(async a => {
        if (await a.$('span span') === null) {
            return null;
        }
        if (!(await a.getAttribute('href')).includes("media")) {
            return {
                url: _URL + await a.getAttribute('href'),
                name: (await (await a.$('span span')).textContent()).trim(),
            }
        }
        return null;
    }));
}

export async function getLatestMessagesFromThread(page, threadURL) {
    await page.goto(threadURL);
    await page.waitForSelector("div[data-testid='solid-message-bubble']");
    const messages = await page.$$("div[role='gridcell']")
    return await Promise.all(messages.map(async m => {
        if (await m.$("div[role='none'][dir='auto']") === null || await m.$('h4') === null) {
            return null;
        }
        return {
            message: await (await m.$("div[role='none'][dir='auto']")).textContent(),
            sender: await (await m.$('h4')).textContent(),
        }
    }));
}