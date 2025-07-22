/**
 * Content Script for ChatGPT Switcher
 * Extracts user email from ChatGPT page and handles page interactions
 */

class ChatGPTContentScript {
	constructor() {
		this.init();
	}

	init() {
		this.setupMessageListener();
		this.observePageChanges();
	}

	setupMessageListener() {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (request.action === 'getUsername') {
				this.getUserEmail()
					.then(email => sendResponse({ email }))
					.catch(error => {
						console.error('Error getting username:', error);
						sendResponse({ email: null, error: error.message });
					});
				return true; // Indicates we will send a response asynchronously
			}
			if (request.action === 'getAvatar') {
				this.getUserAvatar()
					.then(avatar => sendResponse({ avatar }))
					.catch(error => {
						console.error('Error getting avatar:', error);
						sendResponse({ avatar: null, error: error.message });
					});
				return true; // Indicates we will send a response asynchronously
			}
		});
	}

	/**
	 * Extract user email from various sources on the ChatGPT page
	 * @returns {Promise<string|null>} User email or null if not found
	 */
	async getUserEmail() {
		// Method 1: Check for email in script tags (Next.js __NEXT_DATA__)
		const emailFromScript = this.extractEmailFromScripts();
		if (emailFromScript) {
			console.log('Email found in script:', emailFromScript);
			return emailFromScript;
		}

		// Method 2: Check for user info in localStorage/sessionStorage
		const emailFromStorage = this.extractEmailFromStorage();
		if (emailFromStorage) {
			return emailFromStorage;
		}

		// Method 3: Look for email in DOM elements
		const emailFromDOM = this.extractEmailFromDOM();
		if (emailFromDOM) {
			return emailFromDOM;
		}

		// Method 4: Wait for dynamic content to load
		return await this.waitForEmailToLoad();
	}

	async getUserAvatar() {
		// Try to find the avatar image element by alt and class
		const img = document.querySelector('img[alt="Profile image"].h-6.w-6.shrink-0');
		if (img && img.src) {
			return img.src;
		}
		return null;
	}

	extractEmailFromScripts() {
		try {
			const scripts = document.querySelectorAll('script');
			
			for (const script of scripts) {
				const content = script.textContent || script.innerText;
				
				// Skip empty scripts
				if (!content || content.trim().length === 0) continue;
				
				// Look for various patterns including React Router context
				const patterns = [
					// Standard JSON patterns
					/["']email["']\s*:\s*["']([^"']+)["']/g,
					/\\"email\\"\s*:\s*\\"([^"\\]+)\\"/g,
					/email["']?\s*:\s*["']([^"']+)["']/g,
					/"user":\s*{[^}]*"email"\s*:\s*"([^"]+)"/g,
					
					// React Router context patterns
					/window\.__reactRouterContext[^}]*"email"\s*[,:]?\s*"([^"]+)"/gi,
					/__NEXT_DATA__[^}]*"email"\s*[,:]?\s*"([^"]+)"/gi,
					
					// More flexible email extraction from large data structures
					/"email"\s*[,:]?\s*"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"/g,
					/email['"]\s*[,:]?\s*['"]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*['"]/g
				];

				for (const pattern of patterns) {
					const matches = content.matchAll(pattern);
					for (const match of matches) {
						const email = match[1];
						if (this.isValidEmail(email)) {
							console.log('Found email with pattern:', pattern.source, 'Email:', email);
							return email;
						}
					}
				}
				
				// Fallback: Direct regex search for any email-like pattern in the script
				// This is more aggressive and might catch the email even in complex structures
				const emailMatches = content.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g);
				if (emailMatches) {
					for (const email of emailMatches) {
						if (this.isValidEmail(email) && !this.isCommonTestEmail(email)) {
							console.log('Found email with fallback search:', email);
							return email;
						}
					}
				}
			}
		} catch (error) {
			console.error('Error extracting email from scripts:', error);
		}
		
		return null;
	}

	extractEmailFromStorage() {
		try {
			// Check localStorage
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && (key.includes('user') || key.includes('auth') || key.includes('session'))) {
					try {
						const value = localStorage.getItem(key);
						const parsed = JSON.parse(value);
						const email = this.findEmailInObject(parsed);
						if (email) return email;
					} catch (e) {
						// Not JSON, skip
					}
				}
			}

			// Check sessionStorage
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key && (key.includes('user') || key.includes('auth') || key.includes('session'))) {
					try {
						const value = sessionStorage.getItem(key);
						const parsed = JSON.parse(value);
						const email = this.findEmailInObject(parsed);
						if (email) return email;
					} catch (e) {
						// Not JSON, skip
					}
				}
			}
		} catch (error) {
			console.error('Error extracting email from storage:', error);
		}

		return null;
	}

	extractEmailFromDOM() {
		try {
			// Look for email in common selectors
			const selectors = [
				'[data-testid="user-email"]',
				'[aria-label*="email"]',
				'.user-email',
				'[title*="@"]',
				'span:contains("@")',
				'div:contains("@")'
			];

			for (const selector of selectors) {
				const elements = document.querySelectorAll(selector);
				for (const element of elements) {
					const text = element.textContent || element.title || element.getAttribute('aria-label') || '';
					const email = this.extractEmailFromText(text);
					if (email) return email;
				}
			}

			// Look for any text that looks like an email
			const allText = document.body.textContent || '';
			const emailMatch = allText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
			if (emailMatch && this.isValidEmail(emailMatch[0])) {
				return emailMatch[0];
			}
		} catch (error) {
			console.error('Error extracting email from DOM:', error);
		}

		return null;
	}

	async waitForEmailToLoad(maxWaitTime = 5000, checkInterval = 500) {
		return new Promise((resolve) => {
			let totalWaitTime = 0;
			
			const checkForEmail = () => {
				const email = this.extractEmailFromScripts() || 
							 this.extractEmailFromStorage() || 
							 this.extractEmailFromDOM();
				
				if (email) {
					resolve(email);
					return;
				}

				totalWaitTime += checkInterval;
				if (totalWaitTime >= maxWaitTime) {
					resolve(null);
					return;
				}

				setTimeout(checkForEmail, checkInterval);
			};

			checkForEmail();
		});
	}

	findEmailInObject(obj) {
		if (!obj || typeof obj !== 'object') return null;

		// Direct email property
		if (obj.email && this.isValidEmail(obj.email)) {
			return obj.email;
		}

		// Nested search
		for (const key in obj) {
			if (key.toLowerCase().includes('email') && this.isValidEmail(obj[key])) {
				return obj[key];
			}
			
			if (typeof obj[key] === 'object') {
				const nestedEmail = this.findEmailInObject(obj[key]);
				if (nestedEmail) return nestedEmail;
			}
		}

		return null;
	}

	extractEmailFromText(text) {
		if (!text) return null;
		
		const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
		return emailMatch && this.isValidEmail(emailMatch[0]) ? emailMatch[0] : null;
	}

	isValidEmail(email) {
		if (!email || typeof email !== 'string') return false;
		
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email) && email.length > 3 && email.length < 256;
	}

	isCommonTestEmail(email) {
		if (!email) return false;
		
		const testEmailPatterns = [
			/test@/i,
			/example@/i,
			/demo@/i,
			/@example\./i,
			/@test\./i,
			/@demo\./i,
			/noreply@/i,
			/no-reply@/i
		];
		
		return testEmailPatterns.some(pattern => pattern.test(email));
	}

	observePageChanges() {
		// Watch for dynamic content changes that might reveal the email
		if (typeof MutationObserver !== 'undefined') {
			const observer = new MutationObserver((mutations) => {
				// Only check if we haven't found an email yet
				// This is mainly for SPAs where content loads dynamically
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: false
			});

			// Stop observing after a reasonable time
			setTimeout(() => observer.disconnect(), 10000);
		}
	}

	// Method to manually trigger email detection (for debugging)
	detectEmail() {
		return this.getUserEmail();
	}
}

// Initialize the content script
const chatGPTContentScript = new ChatGPTContentScript();

// Export for debugging purposes
if (typeof window !== 'undefined') {
	window.chatGPTSwitcher = chatGPTContentScript;
}
