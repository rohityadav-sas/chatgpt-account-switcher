class ChatGPTContentScript {
	constructor() {
		this.init()
	}

	init() {
		this.setupMessageListener()
		this.initKeyboardShortcut()
	}

	async waitForElement(selector, predicate) {
		const el = Array.from(document.querySelectorAll(selector)).find(
			predicate ?? (() => true)
		)
		if (el) return el

		return new Promise((resolve) => {
			const observer = new MutationObserver(() => {
				const el = Array.from(document.querySelectorAll(selector)).find(
					predicate ?? (() => true)
				)
				if (el) {
					observer.disconnect()
					resolve(el)
				}
			})
			observer.observe(document.body, { childList: true, subtree: true })
		})
	}

	showToast(message, type = "loading") {
		const existingToast = document.querySelector("#bulk-delete-toast")
		if (existingToast) {
			existingToast.remove()
		}

		const toast = document.createElement("div")
		toast.id = "bulk-delete-toast"

		const icons = {
			loading: "⏳",
			success: "✅",
			error: "❌"
		}

		const colors = {
			loading: "#3b82f6",
			success: "#10b981",
			error: "#ef4444"
		}

		toast.style.cssText = `
			position: fixed;
			top: 16px;
			right: 16px;
			background: white;
			border: 1px solid #e5e7eb;
			border-left: 3px solid ${colors[type]};
			border-radius: 8px;
			padding: 10px 14px;
			box-shadow: 0 4px 8px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
			z-index: 10001;
			display: flex;
			align-items: center;
			gap: 8px;
			max-width: 300px;
			animation: slideInRight 0.3s ease-out;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		`

		toast.innerHTML = `
			<span style="font-size: 14px;">${icons[type]}</span>
			<span style="color: #374151; font-weight: 500; font-size: 14px; white-space: nowrap;">${message}</span>
		`

		const toastStyle = document.createElement("style")
		toastStyle.textContent = `
			@keyframes slideInRight {
				from { transform: translateX(100%); opacity: 0; }
				to { transform: translateX(0); opacity: 1; }
			}
		`
		document.head.appendChild(toastStyle)

		document.body.appendChild(toast)

		if (type !== "loading") {
			setTimeout(() => {
				if (toast.parentNode) {
					toast.style.animation = "slideInRight 0.3s ease-out reverse"
					setTimeout(() => {
						toast.remove()
						toastStyle.remove()
					}, 300)
				}
			}, 3000)
		}

		return toast
	}

	async handleDeleteAllConversations() {
		try {
			const loadingToast = this.showToast(
				"Deleting all conversations...",
				"loading"
			)

			window.location.hash = "settings/DataControls"

			const deleteAllButton = await this.waitForElement(
				"button",
				(btn) => btn.innerText.trim() === "Delete all"
			)
			deleteAllButton.click()

			const confirmButton = await this.waitForElement(
				'button[data-testid="confirm-delete-all-chats-button"]'
			)
			confirmButton.click()

			const closeButton = document.querySelector(
				'button[data-testid="close-button"]'
			)

			closeButton?.click()

			const ctrlShiftO = new KeyboardEvent("keydown", {
				key: "o",
				code: "KeyO",
				ctrlKey: true,
				shiftKey: true,
				bubbles: true
			})

			document.dispatchEvent(ctrlShiftO)

			loadingToast.remove()
			this.showToast("All conversations deleted successfully!", "success")

			setTimeout(() => {
				window.location.hash = ""
			}, 1500)
		} catch (err) {
			console.error("Error deleting all chats:", err)

			const loadingToast = document.querySelector("#bulk-delete-toast")
			if (loadingToast) loadingToast.remove()

			this.showToast(
				"Failed to delete conversations. Please try again.",
				"error"
			)
		}
	}

	initKeyboardShortcut() {
		document.addEventListener("keydown", (e) => {
			if (e.ctrlKey && e.shiftKey && e.key === "D") {
				e.preventDefault()
				this.handleDeleteAllConversations()
			}
		})
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

const chatGPTContentScript = new ChatGPTContentScript()

if (typeof window !== "undefined") {
	window.chatGPTSwitcher = chatGPTContentScript
}
