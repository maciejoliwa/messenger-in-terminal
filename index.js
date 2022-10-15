import chalk from 'chalk';
import boxen from 'boxen';
import prompt_fn from 'prompt-sync'
import playwright from 'playwright';
import { login, getAllVisibleThreads, getLatestMessagesFromThread, sendMessage } from "./api.js";

function greet() {
    const greeting = chalk.white.bold("Hello! This is a messenger in terminal!");
    const opts = {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue',
    }
    const box = boxen(greeting, opts);
    console.log(box);
}

const prompt = prompt_fn();

(async () => {
    greet();
    const browser = await playwright.chromium.launch({ headless: false, args: ["--start-maximized"] });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    const email = prompt('Your email > ');
    const password = prompt('Your password > ');
    console.log(chalk.blue.italic("Logging in..."));
    await login(page, email, password);
    console.log(chalk.green.bold("Logged in!"));
    const threads = (await getAllVisibleThreads(page)).filter(t => !!t);
    console.log(threads);
    threads.forEach((thread, index) => {
        console.log(`${chalk.blueBright.bold(index)} - ${chalk.green.bold(thread.name)}`);
    });

    while (true) {

        const chosenNumber = prompt("Picked chat > ");
        
        if (chosenNumber === ".exit") {
            console.log("Bye!");
            await page.close();
            await context.close();
            await browser.close();
            return;
        }

        if (Number.isNaN(Number.parseInt(chosenNumber))) {
            console.log(chalk.red.bold("You must enter a number!!"));
            continue;
        }

        const pickedThread = threads[Number.parseInt(chosenNumber)];
        
        if (pickedThread === undefined) {
            console.log(chalk.red.bold("Invalid number!!"));
            continue;
        }

        console.clear();

        let messages = await getLatestMessagesFromThread(page, pickedThread.url);
        messages.filter(m => !!m).forEach(({ message, sender }) => {
            if (sender === "You sent") {
                console.log(`${chalk.blue.italic(sender)}: ${message}`);
            } else {
                console.log(`${chalk.yellow.italic(sender)}: ${message}`);
            }
        })

        while (true) {
            const message = prompt("Message > ");

            if (message === ".exit") {
                console.clear();
                threads.forEach((thread, index) => {
                    console.log(`${chalk.blueBright.bold(index)} - ${chalk.green.bold(thread.name)}`);
                });
                break;
            }

            await sendMessage(page, message);
            console.clear();
            let messages = await getLatestMessagesFromThread(page, pickedThread.url, false);
            messages.filter(m => !!m).forEach(({ message, sender }) => {
                if (sender === "You sent") {
                    console.log(`${chalk.blue.italic(sender)}: ${message}`);
                } else {
                    console.log(`${chalk.yellow.italic(sender)}: ${message}`);
                }
            });
        }
    }
})();