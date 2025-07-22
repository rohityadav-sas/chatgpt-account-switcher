import { getStoredAccounts, saveAccounts } from '../utils/storage.js';
import { showNotification, showLoading, hideLoading } from '../utils/ui.js';

class ChatGPTSwitcher {
	constructor() {
		this.elements = {
			accountList: document.getElementById('accountList'),
			addAccountBtn: document.getElementById('addAccountBtn'),
			exportBtn: document.getElementById('exportBtn'),
			importBtn: document.getElementById('importBtn'),
			importFileInput: document.getElementById('importFileInput'),
			clearAllBtn: document.getElementById('clearAllBtn'),
			refreshBtn: document.getElementById('refreshBtn'),
			accountCount: document.getElementById('accountCount'),
			emptyState: document.getElementById('emptyState'),
			confirmationOverlay: document.getElementById('confirmationOverlay'),
			confirmationTitle: document.getElementById('confirmationTitle'),
			confirmationMessage: document.getElementById('confirmationMessage'),
			confirmationCancel: document.getElementById('confirmationCancel'),
			confirmationConfirm: document.getElementById('confirmationConfirm')
		};
		
		this.accounts = [];
		this.init();
	}

	async init() {
		this.attachEventListeners();
		await this.loadAccounts();
	}

	attachEventListeners() {
		this.elements.accountList.addEventListener('click', (e) => {
			this.handleAccountAction(e);
		});

		this.elements.addAccountBtn.addEventListener('click', () => {
			this.addNewAccount();
		});

		this.elements.exportBtn.addEventListener('click', () => {
			this.exportAccounts();
		});

		this.elements.importBtn.addEventListener('click', () => {
			this.elements.importFileInput.click();
		});

		this.elements.importFileInput.addEventListener('change', (e) => {
			this.importAccounts(e.target.files[0]);
		});

		this.elements.clearAllBtn.addEventListener('click', () => {
			this.clearAllAccounts();
		});

		this.elements.refreshBtn.addEventListener('click', () => {
			this.loadAccounts();
		});

		this.elements.confirmationCancel.addEventListener('click', () => {
			this.hideConfirmation();
		});

		this.elements.confirmationConfirm.addEventListener('click', () => {
			if (this.pendingConfirmAction) {
				this.pendingConfirmAction();
				this.hideConfirmation();
			}
		});

		this.elements.confirmationOverlay.addEventListener('click', (e) => {
			if (e.target === this.elements.confirmationOverlay) {
				this.hideConfirmation();
			}
		});
	}

	async loadAccounts() {
		try {
			showLoading();
			this.accounts = await getStoredAccounts();
			this.renderAccounts();
			this.updateAccountCount();
		} catch (error) {
			console.error('Error loading accounts:', error);
			showNotification('Failed to load accounts', 'error');
		} finally {
			hideLoading();
		}
	}

	renderAccounts() {
		if (this.accounts.length === 0) {
			this.showEmptyState();
			return;
		}

		this.hideEmptyState();
		
		const accountsHTML = this.accounts.map((account, index) => {
			const username = this.extractUsername(account.username);
			const email = account.username;
			const avatar = account.avatar || username.charAt(0).toUpperCase();

			const avatarHTML = account.avatar ? 
				`<img class="account-avatar-img" src="${account.avatar}" alt="${username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
				 <div class="account-avatar-fallback" style="display: none;">${username.charAt(0).toUpperCase()}</div>` :
				`<div class="account-avatar-text">${username.charAt(0).toUpperCase()}</div>`;

			return `
				<li class="account slide-up" data-index="${index}" style="animation-delay: ${index * 0.1}s">
					<div class="account-info">
						<div class="account-avatar">
							${avatarHTML}
						</div>
						<div class="account-details">
							<div class="account-username">${username}</div>
							<div class="account-email">${email}</div>
						</div>
					</div>
					<div class="account-actions">
						<button class="action-btn delete-btn" title="Delete this account">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					</div>
				</li>
			`;
		}).join('');

		this.elements.accountList.innerHTML = accountsHTML;
	}

	async handleAccountAction(event) {
		const deleteBtn = event.target.closest('.delete-btn');
		const accountElement = event.target.closest('.account');
		
		if (!accountElement) return;

		const index = parseInt(accountElement.dataset.index);
		
		if (deleteBtn) {
			await this.deleteAccount(index);
		} else {
			await this.switchAccount(index);
		}
	}

	async addNewAccount() {
		try {
			showLoading();
			
			const { username, sessionToken, avatar } = await this.getCurrentAccountInfo();
			
			if (!username || !sessionToken) {
				showNotification('Please log in to ChatGPT first', 'error');
				return;
			}

			const existingAccountIndex = this.accounts.findIndex(
				account => account.username === username
			);

			if (existingAccountIndex !== -1) {
				// Update existing account
				this.accounts[existingAccountIndex].sessionToken = sessionToken;
				showNotification('Account updated successfully!', 'success');
			} else {
				// Add new account
				this.accounts.push({ username, avatar, sessionToken });
				showNotification('Account added successfully!', 'success');
			}

			await this.saveAccountsAndReload();
		} catch (error) {
			console.error('Error adding account:', error);
			showNotification(error.message, 'error');
		} finally {
			hideLoading();
		}
	}

	async getCurrentAccountInfo() {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const activeTab = tabs[0];
		

		if (!activeTab?.url?.includes('chatgpt.com')) {
			showNotification('Please navigate to ChatGPT first', 'error');
			throw new Error('Please navigate to ChatGPT first');
		}

		const username = await new Promise((resolve) => {
			chrome.tabs.sendMessage(
				activeTab.id, 
				{ action: 'getUsername' }, 
				(response) => {
					resolve(response?.email || '');
				}
			);
		});

		const avatar = await new Promise((resolve) => {
			chrome.tabs.sendMessage(
				activeTab.id,
				{ action: 'getAvatar' },
				(response) => {
					resolve(response?.avatar || '');
				}
			);
		});

		const cookies = await chrome.cookies.getAll({ domain: '.chatgpt.com' });
		const sessionCookie = cookies.find(
			cookie => cookie.name === '__Secure-next-auth.session-token'
		);

		if (!sessionCookie) {
			throw new Error('No session token found');
		}

		return {
			username,
			avatar,
			sessionToken: sessionCookie.value
		};
	}

	async switchAccount(index) {
		try {
			showLoading();
			
			const account = this.accounts[index];
			if (!account) throw new Error('Account not found');

			const success = await chrome.runtime.sendMessage({
				action: 'setCookie',
				username: account.username,
				sessionToken: account.sessionToken
			});

			if (success) {
				showNotification(`Switching to ${this.extractUsername(account.username)}!`, 'success');
				setTimeout(() => window.close(), 1000);
			} else {
				throw new Error('Failed to switch account');
			}
		} catch (error) {
			console.error('Error switching account:', error);
			showNotification('Failed to switch account', 'error');
		} finally {
			hideLoading();
		}
	}

	async deleteAccount(index) {
		try {
			const account = this.accounts[index];
			if (!account) return;

			const username = this.extractUsername(account.username);
			
			// Show custom confirmation dialog
			this.showConfirmation(
				`Delete Account`,
				`Are you sure you want to delete "${username}"? This action cannot be undone.`,
				async () => {
					try {
						showLoading();
						
						this.accounts.splice(index, 1);
						await this.saveAccountsAndReload();
						
						showNotification(`Account "${username}" deleted`, 'success');
					} catch (error) {
						console.error('Error deleting account:', error);
						showNotification('Failed to delete account', 'error');
					} finally {
						hideLoading();
					}
				}
			);
		} catch (error) {
			console.error('Error deleting account:', error);
			showNotification('Failed to delete account', 'error');
		}
	}

	async clearAllAccounts() {
		try {
			if (this.accounts.length === 0) {
				showNotification('No accounts to clear', 'info');
				return;
			}

			const accountCount = this.accounts.length;
			
			this.showConfirmation(
				`Clear All Accounts`,
				`Are you sure you want to clear all ${accountCount} account${accountCount > 1 ? 's' : ''}? This action cannot be undone.`,
				async () => {
					try {
						showLoading();
						
						this.accounts = [];
						await this.saveAccountsAndReload();
						
						showNotification(`All accounts cleared successfully`, 'success');
					} catch (error) {
						console.error('Error clearing accounts:', error);
						showNotification('Failed to clear accounts', 'error');
					} finally {
						hideLoading();
					}
				}
			);
		} catch (error) {
			console.error('Error clearing accounts:', error);
			showNotification('Failed to clear accounts', 'error');
		}
	}

	async saveAccountsAndReload() {
		await saveAccounts(this.accounts);
		await this.loadAccounts();
	}

	showEmptyState() {
		this.elements.emptyState.classList.remove('hidden');
		this.elements.accountList.style.display = 'none';
	}

	hideEmptyState() {
		this.elements.emptyState.classList.add('hidden');
		this.elements.accountList.style.display = 'flex';
	}

	updateAccountCount() {
		this.elements.accountCount.textContent = this.accounts.length.toString();
	}

	extractUsername(email) {
		return email.split('@')[0] || email;
	}

	async exportAccounts() {
		try {
			if (this.accounts.length === 0) {
				showNotification('No accounts to export', 'warning');
				return;
			}

			showLoading();

			const exportData = this.accounts.map(account => ({
				username: account.username,
				avatar: account.avatar || null,
				sessionToken: account.sessionToken
			}));

			const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
				type: 'application/json' 
			});
			
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `chatgpt-accounts-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			showNotification(`Exported ${exportData.length} accounts successfully!`, 'success');
		} catch (error) {
			console.error('Export error:', error);
			showNotification('Failed to export accounts', 'error');
		} finally {
			hideLoading();
		}
	}

	async importAccounts(file) {
		if (!file) return;

		try {
			if (!file.name.toLowerCase().endsWith('.json')) {
				showNotification('Please select a JSON file', 'error');
				return;
			}

			const maxSize = 5 * 1024 * 1024;
			if (file.size > maxSize) {
				showNotification('File is too large. Maximum size is 5MB', 'error');
				return;
			}

			showLoading();

			const fileContent = await this.readFile(file);
			
			const importedAccounts = await this.validateImportData(fileContent);

			const importMode = await this.showImportDialog(importedAccounts.length);
			if (!importMode) return;

			const result = await this.performImport(importedAccounts, importMode);

			const message = importMode === 'merge' 
				? `Successfully imported ${result.imported} accounts (${result.updated} updated, ${result.added} added)`
				: `Successfully imported ${result.imported} accounts`;
			
			showNotification(message, 'success');
			await this.loadAccounts();

		} catch (error) {
			console.error('Import error:', error);
			showNotification(`Import failed: ${error.message}`, 'error');
		} finally {
			hideLoading();
			this.elements.importFileInput.value = '';
		}
	}

	readFile(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			
			reader.onload = (e) => resolve(e.target.result);
			reader.onerror = () => reject(new Error('Failed to read file'));
			
			reader.readAsText(file);
		});
	}

	async validateImportData(jsonString) {
		let data;
		
		try {
			data = JSON.parse(jsonString);
		} catch (error) {
			throw new Error('Invalid JSON format');
		}

		if (!Array.isArray(data)) {
			throw new Error('File must contain an array of accounts');
		}

		if (data.length === 0) {
			throw new Error('No accounts found in the file');
		}

		const validAccounts = [];
		const errors = [];

		data.forEach((account, index) => {
			if (!account || typeof account !== 'object') {
				errors.push(`Account ${index + 1}: Invalid account object`);
				return;
			}

			if (!account.username || typeof account.username !== 'string') {
				errors.push(`Account ${index + 1}: Missing or invalid username`);
				return;
			}

			if (!account.sessionToken || typeof account.sessionToken !== 'string') {
				errors.push(`Account ${index + 1}: Missing or invalid session token`);
				return;
			}

			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(account.username)) {
				errors.push(`Account ${index + 1}: Invalid email format`);
				return;
			}

			validAccounts.push({
				username: account.username.trim(),
				avatar: account.avatar || null,
				sessionToken: account.sessionToken.trim()
			});
		});

		if (errors.length > 0) {
			throw new Error(`Validation errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`);
		}

		if (validAccounts.length === 0) {
			throw new Error('No valid accounts found');
		}

		return validAccounts;
	}

	showImportDialog(accountCount) {
		return new Promise((resolve) => {
			const existingCount = this.accounts.length;
			
			if (existingCount > 0) {
				this.showImportOptionsDialog(accountCount, existingCount, resolve);
			} else {
				this.showImportConfirmationDialog(accountCount, resolve);
			}
		});
	}

	showImportConfirmationDialog(accountCount, resolve) {
		const importOverlay = document.createElement('div');
		importOverlay.className = 'confirmation-overlay show';
		importOverlay.innerHTML = `
			<div class="confirmation-dialog">
				<div class="confirmation-header">
					<div class="confirmation-icon import-icon">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<h3>Import Accounts</h3>
				</div>
				<div class="confirmation-body">
					<p>Import ${accountCount} account${accountCount > 1 ? 's' : ''}?</p>
				</div>
				<div class="confirmation-actions">
					<button id="importConfirmCancel" class="secondary-btn">Cancel</button>
					<button id="importConfirmOk" class="primary-btn">Import</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(importOverlay);
		
		const handleChoice = (choice) => {
			importOverlay.remove();
			resolve(choice);
		};
		
		importOverlay.querySelector('#importConfirmCancel').addEventListener('click', () => handleChoice(null));
		importOverlay.querySelector('#importConfirmOk').addEventListener('click', () => handleChoice('replace'));
		
		importOverlay.addEventListener('click', (e) => {
			if (e.target === importOverlay) {
				handleChoice(null);
			}
		});
	}

	showImportOptionsDialog(accountCount, existingCount, resolve) {
		const importOverlay = document.createElement('div');
		importOverlay.className = 'confirmation-overlay show';
		importOverlay.innerHTML = `
			<div class="confirmation-dialog">
				<div class="confirmation-header">
					<div class="confirmation-icon import-icon">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<h3>Import ${accountCount} Accounts</h3>
				</div>
				<div class="confirmation-body">
					<p>You have ${existingCount} existing account${existingCount > 1 ? 's' : ''}. How would you like to import?</p>
				</div>
				<div class="import-options-actions">
					<button id="importCancel" class="secondary-btn">Cancel</button>
					<button id="importMerge" class="primary-btn">Merge</button>
					<button id="importReplace" class="danger-btn">Replace</button>
				</div>
			</div>
		`;
		
		document.body.appendChild(importOverlay);
		
		const handleChoice = (choice) => {
			importOverlay.remove();
			resolve(choice);
		};
		
		importOverlay.querySelector('#importCancel').addEventListener('click', () => handleChoice(null));
		importOverlay.querySelector('#importMerge').addEventListener('click', () => handleChoice('merge'));
		importOverlay.querySelector('#importReplace').addEventListener('click', () => handleChoice('replace'));
		
		importOverlay.addEventListener('click', (e) => {
			if (e.target === importOverlay) {
				handleChoice(null);
			}
		});
	}

	async performImport(newAccounts, mode) {
		try {
			if (mode === 'replace') {
				this.accounts = newAccounts;
				await saveAccounts(this.accounts);
				
				return {
					imported: newAccounts.length,
					added: newAccounts.length,
					updated: 0
				};
			} else {
				const accountMap = new Map();
				let updated = 0;
				let added = 0;

				this.accounts.forEach(account => {
					accountMap.set(account.username, account);
				});

				newAccounts.forEach(account => {
					if (accountMap.has(account.username)) {
						updated++;
					} else {
						added++;
					}
					accountMap.set(account.username, account);
				});

				this.accounts = Array.from(accountMap.values());
				await saveAccounts(this.accounts);

				return {
					imported: newAccounts.length,
					added,
					updated
				};
			}
		} catch (error) {
			throw new Error(`Import failed: ${error.message}`);
		}
	}

	showConfirmation(title, message, onConfirm) {
		this.elements.confirmationTitle.textContent = title;
		this.elements.confirmationMessage.textContent = message;
		this.pendingConfirmAction = onConfirm;
		this.elements.confirmationOverlay.classList.add('show');
	}

	hideConfirmation() {
		this.elements.confirmationOverlay.classList.remove('show');
		this.pendingConfirmAction = null;
	}
}

document.addEventListener('DOMContentLoaded', () => {
	new ChatGPTSwitcher();
});
