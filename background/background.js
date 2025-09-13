class ChatGPTSwitcherBackground {
	constructor() {
		this.init()
	}

	init() {
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			this.handleMessage(message, sender, sendResponse)
			return true
		})
	}

	async handleMessage(message, sender, sendResponse) {
		try {
			switch (message.action) {
				case "setCookie":
					const success = await this.setCookieAndNavigate(message)
					sendResponse({ success })
					break
				case "getCookies":
					const cookies = await this.getChatGPTCookies()
					sendResponse({ cookies })
					break
				default:
					sendResponse({ error: "Unknown action" })
			}
		} catch (error) {
			console.error("Message handling failed:", error)
			sendResponse({ success: false, error: error.message })
		}
	}

	async setCookieAndNavigate(message) {
		try {
			const { username, sessionToken } = message

			if (!sessionToken) {
				throw new Error("No session token provided")
			}

			await this.setCookie({
				url: "https://chatgpt.com",
				name: "__Secure-next-auth.session-token",
				value: sessionToken,
				domain: ".chatgpt.com",
				path: "/",
				secure: true,
				sameSite: "no_restriction",
			})

			await this.navigateToChatGPT()

			console.log("Successfully switched to account:", username)
			return true
		} catch (error) {
			console.error("Failed to set cookie and navigate:", error)
			throw error
		}
	}

	async setCookie(cookieDetails) {
		return new Promise((resolve, reject) => {
			chrome.cookies.set(cookieDetails, (cookie) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message))
				} else {
					resolve(cookie)
				}
			})
		})
	}

	async getChatGPTCookies() {
		return new Promise((resolve, reject) => {
			chrome.cookies.getAll({ domain: ".chatgpt.com" }, (cookies) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message))
				} else {
					resolve(cookies)
				}
			})
		})
	}

	async navigateToChatGPT() {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
		const currentTab = tabs[0]

		if (
			currentTab?.url?.includes("chatgpt.com") ||
			currentTab?.url?.includes("newtab") ||
			currentTab?.url?.startsWith("chrome://")
		) {
			await chrome.tabs.update(currentTab.id, { url: "https://chatgpt.com" })
		} else {
			await chrome.tabs.create({ url: "https://chatgpt.com" })
		}
	}
}

const chatGPTSwitcherBackground = new ChatGPTSwitcherBackground()
