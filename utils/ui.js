export function showLoading() {
	const overlay = document.getElementById("loadingOverlay")
	if (overlay) {
		overlay.classList.add("show")
	}
}

export function hideLoading() {
	const overlay = document.getElementById("loadingOverlay")
	if (overlay) {
		overlay.classList.remove("show")
	}
}

let notificationTimeout

export function showNotification(message, type = "info", duration = 3000) {
	clearNotification()

	const notification = document.createElement("div")
	notification.className = `${type}-message`
	notification.id = "notification"

	const messageSpan = document.createElement("span")
	messageSpan.textContent = message
	messageSpan.className = "notification-message"

	const closeButton = document.createElement("button")
	closeButton.className = "notification-close"
	closeButton.innerHTML = `
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
	`
	closeButton.title = "Close notification"

	closeButton.addEventListener("click", () => {
		clearNotification()
	})

	notification.appendChild(messageSpan)
	notification.appendChild(closeButton)
	document.body.appendChild(notification)

	notificationTimeout = setTimeout(() => {
		clearNotification()
	}, duration)
}

function clearNotification() {
	if (notificationTimeout) {
		clearTimeout(notificationTimeout)
		notificationTimeout = null
	}

	const existing = document.getElementById("notification")
	if (existing) {
		existing.remove()
	}
}
