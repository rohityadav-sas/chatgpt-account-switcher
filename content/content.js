class ChatGPTContentScript {
	constructor() {
		this.init()
	}

	init() {
		this.setupMessageListener()
		this.observePageChanges()
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
		const emailFromScript = this.extractEmailFromScripts()
		if (emailFromScript) {
			console.log("Email found in script:", emailFromScript)
			return emailFromScript
		}

		const emailFromStorage = this.extractEmailFromStorage()
		if (emailFromStorage) {
			return emailFromStorage
		}

		const emailFromDOM = this.extractEmailFromDOM()
		if (emailFromDOM) {
			return emailFromDOM
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
				const content = script.textContent || script.innerText

				if (!content || content.trim().length === 0) continue

				const patterns = [
					/["']email["']\s*:\s*["']([^"']+)["']/g,
					/\\"email\\"\s*:\s*\\"([^"\\]+)\\"/g,
					/email["']?\s*:\s*["']([^"']+)["']/g,
					/"user":\s*{[^}]*"email"\s*:\s*"([^"]+)"/g,
					/window\.__reactRouterContext[^}]*"email"\s*[,:]?\s*"([^"]+)"/gi,
					/__NEXT_DATA__[^}]*"email"\s*[,:]?\s*"([^"]+)"/gi,
					/"email"\s*[,:]?\s*"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"/g,
					/email['"]\s*[,:]?\s*['"]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*['"]/g,
				]

				for (const pattern of patterns) {
					const matches = content.matchAll(pattern)
					for (const match of matches) {
						const email = match[1]
						if (this.isValidEmail(email)) {
							console.log(
								"Found email with pattern:",
								pattern.source,
								"Email:",
								email
							)
							return email
						}
					}
				}

				const emailMatches = content.match(
					/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g
				)
				if (emailMatches) {
					for (const email of emailMatches) {
						if (this.isValidEmail(email) && !this.isCommonTestEmail(email)) {
							console.log("Found email with fallback search:", email)
							return email
						}
					}
				}
			}
		} catch (error) {
			console.error("Error extracting email from scripts:", error)
		}

		return null
	}

	extractEmailFromStorage() {
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i)
				if (
					key &&
					(key.includes("user") ||
						key.includes("auth") ||
						key.includes("session"))
				) {
					try {
						const value = localStorage.getItem(key)
						const parsed = JSON.parse(value)
						const email = this.findEmailInObject(parsed)
						if (email) return email
					} catch (e) {}
				}
			}

			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i)
				if (
					key &&
					(key.includes("user") ||
						key.includes("auth") ||
						key.includes("session"))
				) {
					try {
						const value = sessionStorage.getItem(key)
						const parsed = JSON.parse(value)
						const email = this.findEmailInObject(parsed)
						if (email) return email
					} catch (e) {}
				}
			}
		} catch (error) {
			console.error("Error extracting email from storage:", error)
		}

		return null
	}

	extractEmailFromDOM() {
		try {
			const selectors = [
				'[data-testid="user-email"]',
				'[aria-label*="email"]',
				".user-email",
				'[title*="@"]',
				'span:contains("@")',
				'div:contains("@")',
			]

			for (const selector of selectors) {
				const elements = document.querySelectorAll(selector)
				for (const element of elements) {
					const text =
						element.textContent ||
						element.title ||
						element.getAttribute("aria-label") ||
						""
					const email = this.extractEmailFromText(text)
					if (email) return email
				}
			}

			const allText = document.body.textContent || ""
			const emailMatch = allText.match(
				/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
			)
			if (emailMatch && this.isValidEmail(emailMatch[0])) {
				return emailMatch[0]
			}
		} catch (error) {
			console.error("Error extracting email from DOM:", error)
		}

		return null
	}

	async waitForEmailToLoad(maxWaitTime = 5000, checkInterval = 500) {
		return new Promise((resolve) => {
			let totalWaitTime = 0

			const checkForEmail = () => {
				const email =
					this.extractEmailFromScripts() ||
					this.extractEmailFromStorage() ||
					this.extractEmailFromDOM()

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

	findEmailInObject(obj) {
		if (!obj || typeof obj !== "object") return null

		if (obj.email && this.isValidEmail(obj.email)) {
			return obj.email
		}

		for (const key in obj) {
			if (key.toLowerCase().includes("email") && this.isValidEmail(obj[key])) {
				return obj[key]
			}

			if (typeof obj[key] === "object") {
				const nestedEmail = this.findEmailInObject(obj[key])
				if (nestedEmail) return nestedEmail
			}
		}

		return null
	}

	extractEmailFromText(text) {
		if (!text) return null

		const emailMatch = text.match(
			/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
		)
		return emailMatch && this.isValidEmail(emailMatch[0]) ? emailMatch[0] : null
	}

	isValidEmail(email) {
		if (!email || typeof email !== "string") return false

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email) && email.length > 3 && email.length < 256
	}

	isCommonTestEmail(email) {
		if (!email) return false

		const testEmailPatterns = [
			/test@/i,
			/example@/i,
			/demo@/i,
			/@example\./i,
			/@test\./i,
			/@demo\./i,
			/noreply@/i,
			/no-reply@/i,
		]

		return testEmailPatterns.some((pattern) => pattern.test(email))
	}

	observePageChanges() {
		if (typeof MutationObserver !== "undefined") {
			const observer = new MutationObserver((mutations) => {})

			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: false,
			})

			setTimeout(() => observer.disconnect(), 10000)
		}
	}

	detectEmail() {
		return this.getUserEmail()
	}
}

const chatGPTContentScript = new ChatGPTContentScript()

if (typeof window !== "undefined") {
	window.chatGPTSwitcher = chatGPTContentScript
}
