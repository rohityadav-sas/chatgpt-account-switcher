/**
 * Type definitions and constants for ChatGPT Switcher
 * This file provides type checking utilities and constants
 */

// Account interface validation
export const AccountType = {
	isValid: (account) => {
		return account && 
			   typeof account === 'object' &&
			   typeof account.username === 'string' && 
			   typeof account.sessionToken === 'string' &&
			   account.username.length > 0 &&
			   account.sessionToken.length > 0 &&
			   isValidEmail(account.username);
	},

	create: (username, sessionToken) => {
		const account = { username: username.trim(), sessionToken: sessionToken.trim() };
		if (AccountType.isValid(account)) {
			return account;
		}
		throw new Error('Invalid account data');
	}
};

// Message types for communication between scripts
export const MessageTypes = {
	GET_USERNAME: 'getUsername',
	SET_COOKIE: 'setCookie',
	GET_COOKIES: 'getCookies',
	EXPORT_ACCOUNTS: 'exportAccounts',
	IMPORT_ACCOUNTS: 'importAccounts',
	CLEAR_ACCOUNTS: 'clearAccounts'
};

// Storage keys
export const StorageKeys = {
	ACCOUNTS: 'accounts',
	SETTINGS: 'settings',
	THEME: 'theme'
};

// Extension constants
export const Constants = {
	CHATGPT_DOMAIN: '.chatgpt.com',
	CHATGPT_URL: 'https://chatgpt.com',
	SESSION_COOKIE_NAME: '__Secure-next-auth.session-token',
	MAX_ACCOUNTS: 50,
	MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
	SUPPORTED_FILE_TYPES: ['.json'],
	VERSION: '2.0.0'
};

// Error types
export class ExtensionError extends Error {
	constructor(message, code = 'UNKNOWN_ERROR') {
		super(message);
		this.name = 'ExtensionError';
		this.code = code;
	}
}

export class ValidationError extends ExtensionError {
	constructor(message) {
		super(message, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

export class StorageError extends ExtensionError {
	constructor(message) {
		super(message, 'STORAGE_ERROR');
		this.name = 'StorageError';
	}
}

export class NetworkError extends ExtensionError {
	constructor(message) {
		super(message, 'NETWORK_ERROR');
		this.name = 'NetworkError';
	}
}

// Validation utilities
export function isValidEmail(email) {
	if (!email || typeof email !== 'string') return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length > 3 && email.length < 256;
}

export function isValidSessionToken(token) {
	if (!token || typeof token !== 'string') return false;
	return token.length > 10 && !token.includes(' ');
}

export function isValidAccountArray(accounts) {
	return Array.isArray(accounts) && accounts.every(AccountType.isValid);
}

// Response wrapper for consistent API responses
export class ApiResponse {
	constructor(success = false, data = null, error = null, message = '') {
		this.success = success;
		this.data = data;
		this.error = error;
		this.message = message;
		this.timestamp = Date.now();
	}

	static success(data, message = '') {
		return new ApiResponse(true, data, null, message);
	}

	static error(error, message = '') {
		return new ApiResponse(false, null, error, message);
	}
}

// Settings interface
export const SettingsType = {
	default: () => ({
		theme: 'dark',
		autoClose: true,
		showNotifications: true,
		exportFormat: 'json',
		importMode: 'replace',
		maxAccounts: Constants.MAX_ACCOUNTS
	}),

	isValid: (settings) => {
		return settings &&
			   typeof settings === 'object' &&
			   typeof settings.theme === 'string' &&
			   typeof settings.autoClose === 'boolean' &&
			   typeof settings.showNotifications === 'boolean';
	}
};

// Export format options
export const ExportFormats = {
	JSON: 'json',
	CSV: 'csv'
};

// Import modes
export const ImportModes = {
	REPLACE: 'replace',
	MERGE: 'merge'
};

// Theme options
export const Themes = {
	DARK: 'dark',
	LIGHT: 'light',
	AUTO: 'auto'
};

// Utility for creating typed objects
export const TypedObject = {
	Account: AccountType,
	Settings: SettingsType,
	Message: (type, payload = {}) => ({ action: type, ...payload }),
	Response: ApiResponse
};
