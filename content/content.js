{
class ChatGPTContentScript {
	constructor() {
		this.init()
	}

	init() {
		this.setupMessageListener()
	}

	setupMessageListener() {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (request.action === "getUsername") {
				this.getUserEmail()
					.then((email) => sendResponse({ email }))
					.catch((error) => {
						console.error("Error getting username:", error)
						sendResponse({ email: null, error: error.message })
					})
				return true
			}
			if (request.action === "getAvatar") {
				this.getUserAvatar()
					.then((avatar) => sendResponse({ avatar }))
					.catch((error) => {
						console.error("Error getting avatar:", error)
						sendResponse({ avatar: null, error: error.message })
					})
				return true
			}
			if (request.action === "getFullName") {
				this.getUserFullName()
					.then((fullName) => sendResponse({ fullName }))
					.catch((error) => {
						console.error("Error getting full name:", error)
						sendResponse({ fullName: null, error: error.message })
					})
				return true
			}
		})
	}

	async getUserEmail() {
        try {
            const response = await fetch('/api/auth/session', { credentials: 'include', signal: AbortSignal.timeout(5000) })
            if (response.ok) {
                const session = await response.json()
                if (session.user?.email) return session.user.email
            }
        } catch (error) {
            console.warn('Session lookup unavailable; trying page data')
        }
		const emailFromScript = this.extractEmailFromScripts()
		if (emailFromScript) {
			return emailFromScript
		}

		return await this.waitForEmailToLoad()
	}

	async getUserAvatar() {
		const img = document.querySelector('img[alt="Profile image"]')
		if (img && img.src) {
			return img.src
		}
		return null
	}

	async getUserFullName() {
		const name = document
			.querySelector('[data-testid="accounts-profile-button"] .truncate')
			?.textContent.trim()
		if (name) return name
		return null
	}

	extractEmailFromScripts() {
		try {
			const scripts = document.querySelectorAll("script")
			for (const script of scripts) {
				const content = script.textContent

				if (!content) continue

				const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
				const matches = content.match(pattern)
				if (matches) return matches[0]
			}
		} catch (error) {
			console.error("Error extracting email from scripts:", error)
		}
		return null
	}

	async waitForEmailToLoad(maxWaitTime = 5000, checkInterval = 500) {
		return new Promise((resolve) => {
			let totalWaitTime = 0

			const checkForEmail = () => {
				const email = this.extractEmailFromScripts()

				if (email) {
					resolve(email)
					return
				}

				totalWaitTime += checkInterval
				if (totalWaitTime >= maxWaitTime) {
					resolve(null)
					return
				}

				setTimeout(checkForEmail, checkInterval)
			}

			checkForEmail()
		})
	}
}

if (!window.chatGPTSwitcher) {
const chatGPTContentScript = new ChatGPTContentScript()

if (typeof window !== "undefined") {
	window.chatGPTSwitcher = chatGPTContentScript
}

}
}
