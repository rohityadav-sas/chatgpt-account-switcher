class ImportManager {
	constructor() {
		this.elements = {
			dropArea: document.getElementById('dropArea'),
			fileInput: document.getElementById('importFile'),
			fileName: document.getElementById('fileName'),
			fileNameText: document.getElementById('fileNameText'),
			importBtn: document.getElementById('importBtn'),
			cancelBtn: document.getElementById('cancelBtn'),
			progress: document.getElementById('progress'),
			progressBar: document.getElementById('progressBar'),
			message: document.getElementById('message')
		};

		this.selectedFile = null;
		this.init();
	}

	init() {
		this.setupEventListeners();
		this.setupDragAndDrop();
	}

	setupEventListeners() {
		this.elements.fileInput.addEventListener('change', (e) => {
			this.handleFileSelect(e.target.files[0]);
		});

		this.elements.importBtn.addEventListener('click', () => {
			this.importAccounts();
		});

		this.elements.cancelBtn.addEventListener('click', () => {
			this.closeWindow();
		});

		this.elements.dropArea.addEventListener('click', (e) => {
			if (e.target !== this.elements.fileInput && !e.target.closest('.file-input-wrapper')) {
				this.elements.fileInput.click();
			}
		});
	}

	setupDragAndDrop() {
		const dropArea = this.elements.dropArea;

		['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
			dropArea.addEventListener(eventName, this.preventDefaults, false);
			document.body.addEventListener(eventName, this.preventDefaults, false);
		});

		['dragenter', 'dragover'].forEach(eventName => {
			dropArea.addEventListener(eventName, () => {
				dropArea.classList.add('dragover');
			});
		});

		['dragleave', 'drop'].forEach(eventName => {
			dropArea.addEventListener(eventName, () => {
				dropArea.classList.remove('dragover');
			});
		});

		dropArea.addEventListener('drop', (e) => {
			const files = e.dataTransfer.files;
			if (files.length > 0) {
				this.handleFileSelect(files[0]);
			}
		});
	}

	preventDefaults(e) {
		e.preventDefault();
		e.stopPropagation();
	}

	handleFileSelect(file) {
		if (!file) return;

		if (!file.name.toLowerCase().endsWith('.json')) {
			this.showMessage('Please select a JSON file.', 'error');
			return;
		}

		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			this.showMessage('File is too large. Maximum size is 5MB.', 'error');
			return;
		}

		this.selectedFile = file;
		this.updateFileName(file.name);
		this.elements.importBtn.disabled = false;
		this.hideMessage();
	}

	updateFileName(name) {
		this.elements.fileNameText.textContent = name;
		this.elements.fileName.classList.add('show');
	}

	async importAccounts() {
		if (!this.selectedFile) return;

		try {
			this.setImportingState(true);
			this.showProgress(0);

			const fileContent = await this.readFile(this.selectedFile);
			this.showProgress(25);

			const accounts = this.validateAccountsData(fileContent);
			this.showProgress(50);

			const importMode = document.querySelector('input[name="importMode"]:checked').value;
			
			const result = await this.performImport(accounts, importMode);
			this.showProgress(100);

			const message = importMode === 'merge' 
				? `Successfully imported ${result.imported} accounts (${result.updated} updated, ${result.added} added)`
				: `Successfully imported ${result.imported} accounts`;
			
			this.showMessage(message, 'success');

			setTimeout(() => {
				this.closeWindow();
			}, 3000);

		} catch (error) {
			console.error('Import error:', error);
			this.showMessage(`Import failed: ${error.message}`, 'error');
		} finally {
			this.setImportingState(false);
			setTimeout(() => this.hideProgress(), 1000);
		}
	}

	readFile(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			
			reader.onload = (e) => {
				resolve(e.target.result);
			};
			
			reader.onerror = () => {
				reject(new Error('Failed to read file'));
			};
			
			reader.readAsText(file);
		});
	}

	validateAccountsData(jsonString) {
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
			throw new Error(`Validation errors:\n${errors.join('\n')}`);
		}

		if (validAccounts.length === 0) {
			throw new Error('No valid accounts found');
		}

		return validAccounts;
	}

	async performImport(newAccounts, mode) {
		return new Promise((resolve, reject) => {
			if (mode === 'replace') {
				// Replace all accounts
				chrome.storage.local.set({ accounts: newAccounts }, () => {
					if (chrome.runtime.lastError) {
						reject(new Error(chrome.runtime.lastError.message));
					} else {
						resolve({
							imported: newAccounts.length,
							added: newAccounts.length,
							updated: 0
						});
					}
				});
			} else {
				chrome.storage.local.get('accounts', (data) => {
					if (chrome.runtime.lastError) {
						reject(new Error(chrome.runtime.lastError.message));
						return;
					}

					const existingAccounts = data.accounts || [];
					const accountMap = new Map();
					let updated = 0;
					let added = 0;

					existingAccounts.forEach(account => {
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

					const finalAccounts = Array.from(accountMap.values());

					chrome.storage.local.set({ accounts: finalAccounts }, () => {
						if (chrome.runtime.lastError) {
							reject(new Error(chrome.runtime.lastError.message));
						} else {
							resolve({
								imported: newAccounts.length,
								added,
								updated
							});
						}
					});
				});
			}
		});
	}

	setImportingState(isImporting) {
		this.elements.importBtn.disabled = isImporting;
		this.elements.cancelBtn.disabled = isImporting;
		this.elements.fileInput.disabled = isImporting;

		const btnIcon = this.elements.importBtn.querySelector('svg');
		if (isImporting) {
			btnIcon.classList.add('spinning');
			this.elements.importBtn.innerHTML = `
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="spinning">
					<path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				Importing...
			`;
		} else {
			btnIcon.classList.remove('spinning');
			this.elements.importBtn.innerHTML = `
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<polyline points="8,10 12,6 16,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<line x1="12" y1="6" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				Import Accounts
			`;
		}
	}

	showProgress(percentage) {
		this.elements.progress.classList.add('show');
		this.elements.progressBar.style.width = `${percentage}%`;
	}

	hideProgress() {
		this.elements.progress.classList.remove('show');
		this.elements.progressBar.style.width = '0%';
	}

	showMessage(message, type) {
		this.elements.message.textContent = message;
		this.elements.message.className = `message show ${type}`;
	}

	hideMessage() {
		this.elements.message.classList.remove('show');
	}

	closeWindow() {
		window.close();
	}
}

document.addEventListener('DOMContentLoaded', () => {
	new ImportManager();
});
