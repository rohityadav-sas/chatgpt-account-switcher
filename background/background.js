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
				case "switchAccount": {
					const success = await this.switchAccount(message.accountData)
					sendResponse({ success })
					break
				}
				case "getSession": {
                    const session = await this.readSession(message.tabId)
                    sendResponse({ success: true, ...session })
                    break
                }
                case "addNewAccount": {
					const result = await this.addNewAccount()
					sendResponse(result)
					break
				}
				default:
					sendResponse({ error: "Unknown action" })
			}
		} catch (error) {
			console.error("Message handling failed:", error)
			sendResponse({ success: false, error: error.message })
		}
	}

	async addNewAccount() {
		const loginUrl = "https://chatgpt.com/auth/login"

		try {
			// Remove only cookies belonging to chatgpt.com / its subdomains.
			// Saved accounts in chrome.storage.local are intentionally untouched.
			const allCookies = await new Promise((resolve, reject) => {
				chrome.cookies.getAll({}, (cookies) => {
					const lastError = chrome.runtime.lastError
					if (lastError) {
						reject(new Error(lastError.message))
						return
					}
					resolve(cookies || [])
				})
			})

			const chatGPTCookies = allCookies.filter((cookie) => {
				const domain = String(cookie.domain || "").toLowerCase().replace(/^\./, "")
				return domain === "chatgpt.com" || domain.endsWith(".chatgpt.com")
			})

			await Promise.all(
				chatGPTCookies.map((cookie) => this.removeCookieObject(cookie))
			)

			const [activeTab] = await chrome.tabs.query({
				active: true,
				currentWindow: true
			})

			const activeUrl = activeTab?.url || ""
			const isChatGPTTab = /^(https?:\/\/)([^/]+\.)?chatgpt\.com(?:\/|$)/i.test(activeUrl)

			if (isChatGPTTab && activeTab?.id) {
				// Remove page storage as well, so a previous account cannot be restored
				// from localStorage/sessionStorage after the cookies are deleted.
				try {
					await chrome.scripting.executeScript({
						target: { tabId: activeTab.id },
						func: () => {
							try { localStorage.clear() } catch {}
							try { sessionStorage.clear() } catch {}
						}
					})
				} catch (error) {
					console.warn("Could not clear ChatGPT page storage:", error)
				}

				await chrome.tabs.update(activeTab.id, { url: loginUrl })
			} else {
				await chrome.tabs.create({ url: loginUrl, active: true })
			}

			console.log(`Cleared ${chatGPTCookies.length} ChatGPT cookies and opened login`)
			return {
				success: true,
				removedCookies: chatGPTCookies.length
			}
		} catch (error) {
			console.error("Failed to start a new ChatGPT account session:", error)
			throw error
		}
	}

	async removeCookieObject(cookie) {
		return new Promise((resolve, reject) => {
			const domain = String(cookie.domain || "").replace(/^\./, "")
			const scheme = cookie.secure ? "https" : "http"
			const url = `${scheme}://${domain}${cookie.path || "/"}`

			const details = {
				url,
				name: cookie.name
			}

			if (cookie.storeId) {
				details.storeId = cookie.storeId
			}

			if (cookie.partitionKey) details.partitionKey = cookie.partitionKey

			chrome.cookies.remove(details, () => {
				// Read runtime.lastError so Chromium does not emit an unchecked
				// runtime.lastError warning for cookies that cannot be removed.
				if (chrome.runtime.lastError) {
					reject(new Error(`Could not remove cookie ${cookie.name}: ${chrome.runtime.lastError.message}`))
					return
				}
				resolve()
			})
		})
	}

	async readSession(tabId) {
        const [result] = await chrome.scripting.executeScript({
            target: { tabId },
            func: async () => {
                try {
                    const response = await fetch('/api/auth/session', {
                        credentials: 'include', cache: 'no-store',
                        signal: AbortSignal.timeout(10000)
                    })
                    if (!response.ok) return { error: 'ChatGPT could not verify this sign-in. Please try again.' }
                    const session = await response.json()
                    return { email: session.user?.email || null }
                } catch {
                    return { error: 'Could not check the ChatGPT sign-in. Check your connection and try again.' }
                }
            }
        })
        if (!result?.result) throw new Error('Could not check the ChatGPT sign-in. Reload ChatGPT and try again.')
        if (result.result.error) throw new Error(result.result.error)
        return result.result
    }

    async readStorages(tabId) {
        const [result] = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => ({ local: { ...localStorage }, session: { ...sessionStorage } })
        })
        if (!result?.result) throw new Error('Could not read the current account data. Reload ChatGPT and try again.')
        return result.result
    }

    async switchAccount(accountData) {
		try {
			const { username, cookies, storages } = accountData

			if (!Array.isArray(cookies) || cookies.length === 0 || !storages) {
				throw new Error("No account data provided")
			}

			// Get the active tab
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true
			})

			if (!/^https:\/\/(?:[a-z0-9-]+\.)*chatgpt\.com(?:\/|$)/i.test(tab?.url || "")) {
				throw new Error(`Please navigate to ${this.domain} first`)
			}

			// Keep a rollback snapshot before changing the browser's sign-in.
            const previousStorages = await this.readStorages(tab.id)
            const existingCookies = await this.getChatGPTCookies()
            try {
			for (const cookie of existingCookies) await this.removeCookieObject(cookie)

			// Set all new cookies
			for (const cookie of cookies) await this.setCookie(cookie)

			// Restore localStorage and sessionStorage
			await this.restoreStorages(tab.id, storages)

			// A browser accepting cookies does not mean ChatGPT accepts the session.
            const session = await this.readSession(tab.id)
            if (!session.email || session.email.toLowerCase() !== username.toLowerCase()) {
                throw new Error('ChatGPT did not accept this saved sign-in. Sign in to this account again, then choose Add Current Account to update it.')
            }
            } catch (error) {
                try {
                    const changedCookies = await this.getChatGPTCookies()
                    for (const cookie of changedCookies) await this.removeCookieObject(cookie)
                    for (const cookie of existingCookies) await this.setCookie(cookie)
                    await this.restoreStorages(tab.id, previousStorages)
                } catch {
                    throw new Error(error.message + ' The previous sign-in could not be restored; please sign in again.')
                }
                throw error
            }

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
				url: `https://${String(cookie.domain || this.domain).replace(/^\./, "")}${cookie.path || "/"}`,
				name: cookie.name,
				value: cookie.value,
				path: cookie.path,
				secure: cookie.secure,
				httpOnly: cookie.httpOnly,
				sameSite: cookie.sameSite || "no_restriction"
			}

			if (cookie.storeId) cookieDetails.storeId = cookie.storeId
			if (cookie.partitionKey) cookieDetails.partitionKey = cookie.partitionKey

			// Add expiration if it exists
			if (cookie.expirationDate) {
				cookieDetails.expirationDate = cookie.expirationDate
			}

			// Handle domain based on cookie type
			if (!cookie.hostOnly && !cookie.name.startsWith("__Host-")) {
				cookieDetails.domain = cookie.domain
			} else if (cookie.name.startsWith("__Host-")) {
				cookieDetails.path = "/"
				cookieDetails.secure = true
			}

			chrome.cookies.set(cookieDetails, (result) => {
				if (chrome.runtime.lastError) {
					console.warn(
						`Failed to set cookie ${cookie.name}:`,
						chrome.runtime.lastError.message
					)
					reject(new Error(`Failed to restore cookie ${cookie.name}: ${chrome.runtime.lastError.message}`))
				} else {
					if (!result) reject(new Error(`Failed to restore cookie ${cookie.name}`))
					else resolve(result)
				}
			})
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
