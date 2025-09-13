const validateAccount = (account) => {
	return (
		account &&
		typeof account.username === "string" &&
		typeof account.sessionToken === "string" &&
		account.username.length > 0 &&
		account.sessionToken.length > 0
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

export const addOrUpdateAccount = async (newAccount) => {
	if (!validateAccount(newAccount)) {
		throw new Error("Invalid account data")
	}

	const accounts = await getStoredAccounts()
	const existingIndex = accounts.findIndex(
		(account) => account.username === newAccount.username
	)

	if (existingIndex !== -1) {
		accounts[existingIndex] = { ...accounts[existingIndex], ...newAccount }
		await saveAccounts(accounts)
		return false
	} else {
		accounts.push(newAccount)
		await saveAccounts(accounts)
		return true
	}
}
