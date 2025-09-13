export async function getChatGPTCookies(domain = ".chatgpt.com") {
	return new Promise((resolve, reject) => {
		chrome.cookies.getAll({ domain }, (cookies) => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message))
			} else {
				resolve(cookies || [])
			}
		})
	})
}
