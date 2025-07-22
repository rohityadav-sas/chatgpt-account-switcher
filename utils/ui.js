export function showLoading() {
	const overlay = document.getElementById('loadingOverlay');
	if (overlay) {
		overlay.classList.add('show');
	}
}

export function hideLoading() {
	const overlay = document.getElementById('loadingOverlay');
	if (overlay) {
		overlay.classList.remove('show');
	}
}

let notificationTimeout;

export function showNotification(message, type = 'info', duration = 3000) {
	clearNotification();

	const notification = document.createElement('div');
	notification.className = `${type}-message`;
	notification.id = 'notification';

	const messageSpan = document.createElement('span');
	messageSpan.textContent = message;
	messageSpan.className = 'notification-message';

	const closeButton = document.createElement('button');
	closeButton.className = 'notification-close';
	closeButton.innerHTML = `
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
	`;
	closeButton.title = 'Close notification';
	
	closeButton.addEventListener('click', () => {
		clearNotification();
	});

	notification.appendChild(messageSpan);
	notification.appendChild(closeButton);
	document.body.appendChild(notification);

	notificationTimeout = setTimeout(() => {
		clearNotification();
	}, duration);
}

function clearNotification() {
	if (notificationTimeout) {
		clearTimeout(notificationTimeout);
		notificationTimeout = null;
	}

	const existing = document.getElementById('notification');
	if (existing) {
		existing.remove();
	}
}

export function addAnimation(element, animationClass, duration = 300) {
	return new Promise((resolve) => {
		element.classList.add(animationClass);
		
		setTimeout(() => {
			element.classList.remove(animationClass);
			resolve();
		}, duration);
	});
}

export function setTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme);
	localStorage.setItem('chatgpt-switcher-theme', theme);
}

export function getTheme() {
	return localStorage.getItem('chatgpt-switcher-theme') || 'dark';
}

export function announceToScreenReader(message) {
	const announcement = document.createElement('div');
	announcement.setAttribute('aria-live', 'polite');
	announcement.setAttribute('aria-atomic', 'true');
	announcement.className = 'sr-only';
	announcement.textContent = message;
	
	document.body.appendChild(announcement);
	
	setTimeout(() => {
		document.body.removeChild(announcement);
	}, 1000);
}

export function validateEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export async function copyToClipboard(text) {
	try {
		await navigator.clipboard.writeText(text);
		showNotification('Copied to clipboard!', 'success');
		return true;
	} catch (error) {
		console.error('Failed to copy to clipboard:', error);
		showNotification('Failed to copy to clipboard', 'error');
		return false;
	}
}
