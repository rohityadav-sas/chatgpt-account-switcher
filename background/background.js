class ChatGPTSwitcherBackground {
	constructor() {
		this.domain = "chatgpt.com"
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
				case "switchAccount":
					const success = await this.switchAccount(message.accountData)
					sendResponse({ success })
					break
				default:
					sendResponse({ error: "Unknown action" })
			}
		} catch (error) {
			console.error("Message handling failed:", error)
			sendResponse({ success: false, error: error.message })
		}
	}

	async switchAccount(accountData) {
		try {
			const { username, cookies, storages } = accountData

			if (!cookies || !storages) {
				throw new Error("No account data provided")
			}

			// Get the active tab
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true
			})

			if (!tab?.url?.includes(this.domain)) {
				throw new Error(`Please navigate to ${this.domain} first`)
			}

			// Remove all existing cookies
			const existingCookies = await this.getChatGPTCookies()
			await Promise.all(
				existingCookies.map((cookie) =>
					this.removeCookie(cookie.name, cookie.path)
				)
			)

			// Set all new cookies
			await Promise.all(cookies.map((cookie) => this.setCookie(cookie)))

			// Restore localStorage and sessionStorage
			await this.restoreStorages(tab.id, storages)

			// Reload the page
			await chrome.tabs.reload(tab.id)

			console.log("Successfully switched to account:", username)
			return true
		} catch (error) {
			console.error("Failed to switch account:", error)
			throw error
		}
	}

	async setCookie(cookie) {
		return new Promise((resolve, reject) => {
			const cookieDetails = {
				url: `https://${this.domain}${cookie.path}`,
				name: cookie.name,
				value: cookie.value,
				path: cookie.path,
				secure: cookie.secure,
				httpOnly: cookie.httpOnly,
				sameSite: cookie.sameSite || "no_restriction"
			}

			// Add expiration if it exists
			if (cookie.expirationDate) {
				cookieDetails.expirationDate = cookie.expirationDate
			}

			// Handle domain based on cookie type
			if (!cookie.name.startsWith("__Host-")) {
				cookieDetails.domain = cookie.domain
			} else {
				cookieDetails.path = "/"
				cookieDetails.secure = true
			}

			chrome.cookies.set(cookieDetails, (result) => {
				if (chrome.runtime.lastError) {
					console.warn(
						`Failed to set cookie ${cookie.name}:`,
						chrome.runtime.lastError.message
					)
					resolve(null) // Continue even if one cookie fails
				} else {
					resolve(result)
				}
			})
		})
	}

	async removeCookie(name, path) {
		return new Promise((resolve) => {
			chrome.cookies.remove(
				{
					url: `https://${this.domain}${path}`,
					name: name
				},
				() => {
					resolve()
				}
			)
		})
	}

	async getChatGPTCookies() {
		return new Promise((resolve, reject) => {
			chrome.cookies.getAll({ domain: this.domain }, (cookies) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message))
				} else {
					resolve(cookies)
				}
			})
		})
	}

	async restoreStorages(tabId, storages) {
		return chrome.scripting.executeScript({
			target: { tabId },
			func: (storageData) => {
				// Clear existing storage
				localStorage.clear()
				sessionStorage.clear()

				// Restore localStorage
				if (storageData.local) {
					Object.entries(storageData.local).forEach(([key, value]) => {
						localStorage.setItem(key, value)
					})
				}

				// Restore sessionStorage
				if (storageData.session) {
					Object.entries(storageData.session).forEach(([key, value]) => {
						sessionStorage.setItem(key, value)
					})
				}
			},
			args: [storages]
		})
	}
}

const chatGPTSwitcherBackground = new ChatGPTSwitcherBackground()
