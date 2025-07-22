const validateAccount = (account) => {
	return account && 
		   typeof account.username === 'string' && 
		   typeof account.sessionToken === 'string' &&
		   account.username.length > 0 &&
		   account.sessionToken.length > 0;
};

export const getStoredAccounts = async () => {
	return new Promise((resolve, reject) => {
		try {
			chrome.storage.local.get('accounts', (data) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
					return;
				}

				const accounts = data.accounts || [];
				
				const validAccounts = accounts.filter(validateAccount);
				
				if (validAccounts.length !== accounts.length) {
					console.warn('Removed invalid accounts from storage');
					saveAccounts(validAccounts);
				}

				resolve(validAccounts);
			});
		} catch (error) {
			reject(error);
		}
	});
};

export const saveAccounts = async (accounts, callback) => {
	return new Promise((resolve, reject) => {
		try {
			const validAccounts = accounts.filter(validateAccount);
			
			if (validAccounts.length !== accounts.length) {
				console.warn('Some accounts were invalid and not saved');
			}

			chrome.storage.local.set({ accounts: validAccounts }, () => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
					return;
				}

				if (callback && typeof callback === 'function') {
					callback();
				}
				
				resolve();
			});
		} catch (error) {
			reject(error);
		}
	});
};

export const addOrUpdateAccount = async (newAccount) => {
	if (!validateAccount(newAccount)) {
		throw new Error('Invalid account data');
	}

	const accounts = await getStoredAccounts();
	const existingIndex = accounts.findIndex(
		account => account.username === newAccount.username
	);

	if (existingIndex !== -1) {
		accounts[existingIndex] = { ...accounts[existingIndex], ...newAccount };
		await saveAccounts(accounts);
		return false;
	} else {
		accounts.push(newAccount);
		await saveAccounts(accounts);
		return true;
	}
};

export const removeAccount = async (username) => {
	const accounts = await getStoredAccounts();
	const initialLength = accounts.length;
	
	const filteredAccounts = accounts.filter(
		account => account.username !== username
	);

	if (filteredAccounts.length !== initialLength) {
		await saveAccounts(filteredAccounts);
		return true;
	}
	
	return false;
};

export const removeAccountByIndex = async (index) => {
	const accounts = await getStoredAccounts();
	
	if (index >= 0 && index < accounts.length) {
		accounts.splice(index, 1);
		await saveAccounts(accounts);
		return true;
	}
	
	return false;
};

export const getAccountByUsername = async (username) => {
	const accounts = await getStoredAccounts();
	return accounts.find(account => account.username === username) || null;
};

export const clearAllAccounts = async () => {
	await saveAccounts([]);
};

export const getStorageInfo = async () => {
	return new Promise((resolve) => {
		chrome.storage.local.getBytesInUse('accounts', (bytesInUse) => {
			resolve({
				bytesInUse,
				maxBytes: chrome.storage.local.QUOTA_BYTES || 5242880,
				percentUsed: ((bytesInUse / (chrome.storage.local.QUOTA_BYTES || 5242880)) * 100).toFixed(2)
			});
		});
	});
};

export const exportAccounts = async () => {
	const accounts = await getStoredAccounts();
	return JSON.stringify(accounts, null, 2);
};

export const importAccounts = async (jsonString, merge = false) => {
	try {
		const importedAccounts = JSON.parse(jsonString);
		
		if (!Array.isArray(importedAccounts)) {
			throw new Error('Invalid format: Expected array of accounts');
		}

		const validAccounts = importedAccounts.filter(validateAccount);
		
		if (validAccounts.length === 0) {
			throw new Error('No valid accounts found in import data');
		}

		let finalAccounts = validAccounts;

		if (merge) {
			const existingAccounts = await getStoredAccounts();
			const accountMap = new Map();

			existingAccounts.forEach(account => {
				accountMap.set(account.username, account);
			});

			validAccounts.forEach(account => {
				accountMap.set(account.username, account);
			});

			finalAccounts = Array.from(accountMap.values());
		}

		await saveAccounts(finalAccounts);
		return validAccounts.length;
	} catch (error) {
		throw new Error(`Import failed: ${error.message}`);
	}
};
