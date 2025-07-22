/**
 * Storage Utility Functions
 * Handles Chrome extension storage operations with error handling and validation
 */

// Account interface for type checking
const validateAccount = (account) => {
	return account && 
		   typeof account.username === 'string' && 
		   typeof account.sessionToken === 'string' &&
		   account.username.length > 0 &&
		   account.sessionToken.length > 0;
};

/**
 * Get stored accounts from Chrome storage
 * @returns {Promise<Array>} Array of account objects
 */
export const getStoredAccounts = async () => {
	return new Promise((resolve, reject) => {
		try {
			chrome.storage.local.get('accounts', (data) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
					return;
				}

				const accounts = data.accounts || [];
				
				// Validate and filter accounts
				const validAccounts = accounts.filter(validateAccount);
				
				// If we filtered out invalid accounts, save the clean list
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

/**
 * Save accounts to Chrome storage
 * @param {Array} accounts - Array of account objects
 * @param {Function} callback - Optional callback function
 * @returns {Promise<void>}
 */
export const saveAccounts = async (accounts, callback) => {
	return new Promise((resolve, reject) => {
		try {
			// Validate all accounts before saving
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

/**
 * Add a new account or update existing one
 * @param {Object} newAccount - Account object to add/update
 * @returns {Promise<boolean>} True if account was added, false if updated
 */
export const addOrUpdateAccount = async (newAccount) => {
	if (!validateAccount(newAccount)) {
		throw new Error('Invalid account data');
	}

	const accounts = await getStoredAccounts();
	const existingIndex = accounts.findIndex(
		account => account.username === newAccount.username
	);

	if (existingIndex !== -1) {
		// Update existing account
		accounts[existingIndex] = { ...accounts[existingIndex], ...newAccount };
		await saveAccounts(accounts);
		return false; // Updated
	} else {
		// Add new account
		accounts.push(newAccount);
		await saveAccounts(accounts);
		return true; // Added
	}
};

/**
 * Remove an account by username
 * @param {string} username - Username to remove
 * @returns {Promise<boolean>} True if account was removed
 */
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

/**
 * Remove account by index
 * @param {number} index - Index of account to remove
 * @returns {Promise<boolean>} True if account was removed
 */
export const removeAccountByIndex = async (index) => {
	const accounts = await getStoredAccounts();
	
	if (index >= 0 && index < accounts.length) {
		accounts.splice(index, 1);
		await saveAccounts(accounts);
		return true;
	}
	
	return false;
};

/**
 * Get account by username
 * @param {string} username - Username to find
 * @returns {Promise<Object|null>} Account object or null if not found
 */
export const getAccountByUsername = async (username) => {
	const accounts = await getStoredAccounts();
	return accounts.find(account => account.username === username) || null;
};

/**
 * Clear all accounts
 * @returns {Promise<void>}
 */
export const clearAllAccounts = async () => {
	await saveAccounts([]);
};

/**
 * Get storage usage statistics
 * @returns {Promise<Object>} Storage usage info
 */
export const getStorageInfo = async () => {
	return new Promise((resolve) => {
		chrome.storage.local.getBytesInUse('accounts', (bytesInUse) => {
			resolve({
				bytesInUse,
				maxBytes: chrome.storage.local.QUOTA_BYTES || 5242880, // 5MB default
				percentUsed: ((bytesInUse / (chrome.storage.local.QUOTA_BYTES || 5242880)) * 100).toFixed(2)
			});
		});
	});
};

/**
 * Export accounts to JSON string
 * @returns {Promise<string>} JSON string of accounts
 */
export const exportAccounts = async () => {
	const accounts = await getStoredAccounts();
	return JSON.stringify(accounts, null, 2);
};

/**
 * Import accounts from JSON string
 * @param {string} jsonString - JSON string of accounts
 * @param {boolean} merge - Whether to merge with existing accounts
 * @returns {Promise<number>} Number of accounts imported
 */
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

			// Add existing accounts
			existingAccounts.forEach(account => {
				accountMap.set(account.username, account);
			});

			// Add/update with imported accounts
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
