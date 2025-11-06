const validateAccount = (account) => {
	return (
		account &&
		typeof account.username === "string" &&
		account.username.length > 0 &&
		Array.isArray(account.cookies) &&
		account.cookies.length > 0 &&
		account.storages &&
		typeof account.storages === "object"
	)
}

export const getStoredAccounts = async () => {
	return new Promise((resolve, reject) => {
		try {
			chrome.storage.local.get("accounts", (data) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message))
					return
				}

				const accounts = data.accounts || []
				const validAccounts = accounts.filter(validateAccount)

				if (validAccounts.length !== accounts.length) {
					console.warn("Removed invalid accounts from storage")
					saveAccounts(validAccounts)
				}

				resolve(validAccounts)
			})
		} catch (error) {
			reject(error)
		}
	})
}

export const saveAccounts = async (accounts) => {
	return new Promise((resolve, reject) => {
		try {
			const validAccounts = accounts.filter(validateAccount)

			chrome.storage.local.set({ accounts: validAccounts }, () => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message))
					return
				}
				resolve()
			})
		} catch (error) {
			reject(error)
		}
	})
}
