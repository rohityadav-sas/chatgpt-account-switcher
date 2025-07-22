/**
 * Cookie Utility Functions
 * Handles ChatGPT cookie operations with proper error handling
 */

/**
 * Update the ChatGPT session token cookie
 * @param {string} token - The session token value
 * @param {string} domain - Domain to set the cookie for (default: .chatgpt.com)
 * @returns {Promise<boolean>} Success status
 */
export async function updateSessionToken(token, domain = '.chatgpt.com') {
	try {
		const cookie = await setCookie({
			url: 'https://chatgpt.com',
			name: '__Secure-next-auth.session-token',
			value: token,
			domain: domain,
			path: '/',
			secure: true,
			httpOnly: false, // Set to false for extensions to access
			sameSite: 'no_restriction'
		});

		console.log('Session token updated successfully:', cookie);
		return true;
	} catch (error) {
		console.error('Failed to update session token:', error);
		return false;
	}
}

/**
 * Get all ChatGPT cookies
 * @param {string} domain - Domain to get cookies from (default: .chatgpt.com)
 * @returns {Promise<Array>} Array of cookies
 */
export async function getChatGPTCookies(domain = '.chatgpt.com') {
	return new Promise((resolve, reject) => {
		chrome.cookies.getAll({ domain }, (cookies) => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				resolve(cookies || []);
			}
		});
	});
}

/**
 * Get a specific ChatGPT cookie
 * @param {string} name - Cookie name
 * @param {string} domain - Domain (default: .chatgpt.com)
 * @returns {Promise<Object|null>} Cookie object or null if not found
 */
export async function getChatGPTCookie(name, domain = '.chatgpt.com') {
	try {
		const cookies = await getChatGPTCookies(domain);
		return cookies.find(cookie => cookie.name === name) || null;
	} catch (error) {
		console.error('Failed to get cookie:', error);
		return null;
	}
}

/**
 * Get the current session token
 * @returns {Promise<string|null>} Session token or null if not found
 */
export async function getCurrentSessionToken() {
	try {
		const cookie = await getChatGPTCookie('__Secure-next-auth.session-token');
		return cookie?.value || null;
	} catch (error) {
		console.error('Failed to get current session token:', error);
		return null;
	}
}

/**
 * Clear all ChatGPT cookies
 * @param {string} domain - Domain to clear cookies from (default: .chatgpt.com)
 * @returns {Promise<boolean>} Success status
 */
export async function clearChatGPTCookies(domain = '.chatgpt.com') {
	try {
		const cookies = await getChatGPTCookies(domain);
		const promises = cookies.map(cookie => 
			removeCookie({
				url: `https://${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}`,
				name: cookie.name
			})
		);

		await Promise.all(promises);
		console.log(`Cleared ${cookies.length} ChatGPT cookies`);
		return true;
	} catch (error) {
		console.error('Failed to clear ChatGPT cookies:', error);
		return false;
	}
}

/**
 * Set a cookie using Chrome's cookies API
 * @param {Object} cookieDetails - Cookie details object
 * @returns {Promise<Object>} Set cookie object
 */
function setCookie(cookieDetails) {
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

/**
 * Remove a cookie using Chrome's cookies API
 * @param {Object} details - Cookie removal details
 * @returns {Promise<Object>} Removal details
 */
function removeCookie(details) {
	return new Promise((resolve, reject) => {
		chrome.cookies.remove(details, (details) => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
			} else {
				resolve(details);
			}
		});
	});
}

/**
 * Check if a session token is valid (basic validation)
 * @param {string} token - Session token to validate
 * @returns {boolean} Whether the token appears valid
 */
export function isValidSessionToken(token) {
	if (!token || typeof token !== 'string') {
		return false;
	}

	// Basic validation - session tokens are typically JWT-like or have specific patterns
	// This is a simple check and may need adjustment based on actual token format
	return token.length > 10 && !token.includes(' ') && token.includes('.');
}

/**
 * Get cookie expiration info
 * @param {Object} cookie - Cookie object
 * @returns {Object} Expiration info
 */
export function getCookieExpirationInfo(cookie) {
	if (!cookie.expirationDate) {
		return { expires: false, expired: false, timeLeft: null };
	}

	const expirationTime = cookie.expirationDate * 1000; // Convert to milliseconds
	const currentTime = Date.now();
	const timeLeft = expirationTime - currentTime;

	return {
		expires: true,
		expired: timeLeft <= 0,
		timeLeft: timeLeft > 0 ? timeLeft : 0,
		expirationDate: new Date(expirationTime),
		daysLeft: Math.ceil(timeLeft / (1000 * 60 * 60 * 24))
	};
}
