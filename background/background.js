class ChatGPTSwitcherBackground {
	constructor() {
		this.init();
	}

	init() {
		this.setupEventListeners();
	}

	setupEventListeners() {
		chrome.runtime.onInstalled.addListener((details) => {
			this.handleInstallation(details);
		});

		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			this.handleMessage(message, sender, sendResponse);
			return true;
		});

		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			this.handleTabUpdate(tabId, changeInfo, tab);
		});
	}

	handleInstallation(details) {
		console.log('ChatGPT Switcher installed/updated:', details.reason);
		
		if (details.reason === 'install') {
			this.showWelcomeNotification();
		}
	}

	async handleMessage(message, sender, sendResponse) {
		try {
			switch (message.action) {
				case 'setCookie':
					const success = await this.setCookieAndNavigate(message);
					sendResponse({ success });
					break;
				case 'getCookies':
					const cookies = await this.getChatGPTCookies();
					sendResponse({ cookies });
					break;
				default:
					sendResponse({ error: 'Unknown action' });
			}
		} catch (error) {
			console.error('Message handling failed:', error);
			sendResponse({ success: false, error: error.message });
		}
	}

	handleTabUpdate(tabId, changeInfo, tab) {
		if (changeInfo.status === 'complete' && tab.url?.includes('chatgpt.com')) {
			console.log('ChatGPT tab loaded:', tabId);
		}
	}

	async setCookieAndNavigate(message) {
		try {
			const { username, sessionToken } = message;
			
			if (!sessionToken) {
				throw new Error('No session token provided');
			}

			await this.setCookie({
				url: 'https://chatgpt.com',
				name: '__Secure-next-auth.session-token',
				value: sessionToken,
				domain: '.chatgpt.com',
				path: '/',
				secure: true,
				sameSite: 'no_restriction'
			});

			await this.navigateToChatGPT();

			console.log('Successfully switched to account:', username);
			return true;
		} catch (error) {
			console.error('Failed to set cookie and navigate:', error);
			throw error;
		}
	}

	async setCookie(cookieDetails) {
		return new Promise((resolve, reject) => {
			chrome.cookies.set(cookieDetails, (cookie) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
				} else {
					resolve(cookie);
				}
			});
		});
	}

	async getChatGPTCookies() {
		return new Promise((resolve, reject) => {
			chrome.cookies.getAll({ domain: '.chatgpt.com' }, (cookies) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
				} else {
					resolve(cookies);
				}
			});
		});
	}

	async navigateToChatGPT() {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const currentTab = tabs[0];

		if (currentTab?.url?.includes('chatgpt.com')) {
			await chrome.tabs.reload(currentTab.id);
		} else if (currentTab?.url?.includes('newtab') || currentTab?.url?.startsWith('chrome://')) {
			await chrome.tabs.update(currentTab.id, { url: 'https://chatgpt.com' });
		} else {
			await chrome.tabs.create({ url: 'https://chatgpt.com' });
		}
	}

	showWelcomeNotification() {
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon48.png',
			title: 'ChatGPT Switcher',
			message: 'Extension installed! Click the icon to get started.'
		});
	}

	showSuccessNotification(message) {
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon48.png',
			title: 'ChatGPT Switcher',
			message: message
		});
	}

	showErrorNotification(message) {
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon48.png',
			title: 'ChatGPT Switcher - Error',
			message: message
		});
	}

	showInfoNotification(message) {
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon48.png',
			title: 'ChatGPT Switcher',
			message: message
		});
	}
}

const chatGPTSwitcherBackground = new ChatGPTSwitcherBackground();
