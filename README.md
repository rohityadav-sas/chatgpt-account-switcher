# ChatGPT Account Switcher

Save your ChatGPT accounts in your browser and click a saved account to switch to it.

You sign in through ChatGPT as usual. The extension remembers your signed-in session, so you can use it again while that session remains valid. You may need to sign in again when ChatGPT asks you to.

## Install the latest version

Use Google Chrome or Microsoft Edge on a computer. You do not need to write code or install any developer tools.

1. On [this GitHub page](https://github.com/rohityadav-sas/chatgpt-account-switcher), click the green **Code** button, then **Download ZIP**.
2. Open your Downloads folder. Right-click the downloaded file and choose **Extract All**, then **Extract**.
3. Move the extracted folder somewhere you will keep it, such as your Desktop. Keep this folder after installation: the browser needs its files to run the extension.
4. Open your browser's extension page:
   - **Chrome:** type `chrome://extensions` into the address bar and press Enter.
   - **Edge:** type `edge://extensions` into the address bar and press Enter.
5. Turn on **Developer mode**. This setting lets you install the extension from the folder you downloaded.
6. Click **Load unpacked**. Select the extracted folder that contains **manifest.json**. If you see another folder inside the one you opened, open it first and look for that file.
7. Find **ChatGPT Account Switcher** on the extension page and make sure it is turned on.
8. Click the puzzle-piece **Extensions** button near your browser's address bar. Pin ChatGPT Account Switcher, or choose the option to show it in the toolbar, so you can easily open it.
9. Open [ChatGPT](https://chatgpt.com). If it was already open, refresh the page.

If you already installed the extension from the Chrome Web Store, turn that copy off before using this downloaded version. The store version has not yet been updated with these fixes.

## Save your first account

1. Open [ChatGPT](https://chatgpt.com) and sign in to the account you want to save.
2. Finish every sign-in step, including the verification code if you use two-step authentication. Wait until you can use ChatGPT.
3. Click the **ChatGPT Account Switcher** icon in your browser's toolbar.
4. Click **Add Current Account**.
5. Check that your account appears in the list with the correct email address.

## Add another account

**Save your current account first.** The next steps sign you out of the current ChatGPT session in this browser. Accounts already saved in the extension stay in its list.

1. Open the extension and click **Add New Account**.
2. Read the message and confirm. The ChatGPT sign-in page opens.
3. Sign in to your other account and finish any verification steps.
4. When ChatGPT is ready, open the extension again and click **Add Current Account**.
5. Repeat these steps for each account you want to save.

**Add New Account** opens sign-in for another existing account. You can also follow ChatGPT's sign-up options if you want to create an account.

## Switch accounts

1. Keep a [ChatGPT](https://chatgpt.com) tab open and selected.
2. Open the extension.
3. Click the saved account you want to use.
4. Wait for ChatGPT to reload, then check your profile to confirm you are using the right account.

Switching changes the ChatGPT sign-in used by this browser profile. Other open ChatGPT tabs may need a refresh to show the change.

## If something goes wrong

### My account does not appear when I save it

Make sure you are signed in at **chatgpt.com** and can use ChatGPT. Refresh that page, then try **Add Current Account** again. If you have just installed or updated the extension, refresh the ChatGPT page before trying again.

### Switching asks me to sign in again

Your saved sign-in may have expired. Sign in normally, complete any verification steps, then click **Add Current Account** again. Saving the same email address updates its existing entry.

### My account uses two-step authentication

Keep it enabled. Complete the verification step when signing in, then save the account. The extension does not skip verification or prevent ChatGPT from asking you to sign in again.

### I see “Please navigate to ChatGPT first”

Open [ChatGPT](https://chatgpt.com), select that tab, and open the extension again.

### The extension will not install

Extract the downloaded ZIP before choosing **Load unpacked**. Select the folder containing **manifest.json**, rather than the ZIP file or the folder above it.

### It still does not work

Open a [GitHub issue](https://github.com/rohityadav-sas/chatgpt-account-switcher/issues) and tell us which browser you use, what you clicked, and the error message you saw. Do not include your password, verification codes, or account backup file.

## Update an existing installation

1. Download and extract the latest version using the installation steps above.
2. Copy the files inside the newly extracted extension folder into the folder you originally installed. Choose **Replace** when asked.
3. Open `chrome://extensions` or `edge://extensions`.
4. Find **ChatGPT Account Switcher** and click its reload button (the circular arrow).
5. Refresh your open ChatGPT tabs.

Keep the original installation folder and update its files in place. Removing the extension can remove its saved accounts.

## Manage saved accounts

Hover over a toolbar icon in the extension to see its name.

| Option | What it does |
| --- | --- |
| **Delete this account** | Removes that account from the extension's list. It does not delete your ChatGPT account. |
| **Clear all accounts** | Removes every saved account from the extension after confirmation. It does not delete your ChatGPT accounts. |
| **Refresh accounts** | Reloads the saved account list. |
| **Export accounts** | Downloads a backup of your saved accounts. |
| **Import accounts** | Lets you select a backup file previously exported by this extension. |

Treat an exported backup like a password: it contains sign-in information. Keep it private and never upload it to an issue or send it to someone else. Restoring a backup may still require you to sign in again if its saved sessions have expired.

## Current version

Version **1.2.2** improves account detection, reconnects to already-open ChatGPT pages, adds **Add New Account**, and shows switching errors more accurately.

Automated checks pass. Switching between real signed-in accounts, including accounts with two-step authentication, still needs confirmation. After setup, try switching from your first account to your second and back, checking the profile each time.

## License

[ISC License](LICENSE).
