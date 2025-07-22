export async function updateSessionToken(token, domain = '.chatgpt.com') {
	try {
		const cookie = await setCookie({
			url: 'https://chatgpt.com',
			name: '__Secure-next-auth.session-token',
			value: token,
			domain: domain,
			path: '/',
			secure: true,
			httpOnly: false,
			sameSite: 'no_restriction'
		});

		console.log('Session token updated successfully:', cookie);
		return true;
	} catch (error) {
		console.error('Failed to update session token:', error);
		return false;
	}
}

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

export async function getChatGPTCookie(name, domain = '.chatgpt.com') {
	try {
		const cookies = await getChatGPTCookies(domain);
		return cookies.find(cookie => cookie.name === name) || null;
	} catch (error) {
		console.error('Failed to get cookie:', error);
		return null;
	}
}

export async function getCurrentSessionToken() {
	try {
		const cookie = await getChatGPTCookie('__Secure-next-auth.session-token');
		return cookie?.value || null;
	} catch (error) {
		console.error('Failed to get current session token:', error);
		return null;
	}
}

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

export function isValidSessionToken(token) {
	if (!token || typeof token !== 'string') {
		return false;
	}

	return token.length > 10 && !token.includes(' ') && token.includes('.');
}

export function getCookieExpirationInfo(cookie) {
	if (!cookie.expirationDate) {
		return { expires: false, expired: false, timeLeft: null };
	}

	const expirationTime = cookie.expirationDate * 1000;
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
