<script lang="ts">
	import { notificationStore } from '$lib/stores/notifications';
	import { authStore } from '$lib/stores/auth';
	import { api } from '$lib/api/api';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let showDropdown = false;

	onMount(() => {
		if ($authStore.token) {
			notificationStore.fetchNotifications();
			notificationStore.fetchUnreadCount();
			// Poll for new notifications every 30 seconds
			const interval = setInterval(() => {
				notificationStore.fetchUnreadCount();
			}, 30000);
			return () => clearInterval(interval);
		}
	});

	function toggleDropdown() {
		showDropdown = !showDropdown;
		if (showDropdown) {
			notificationStore.fetchNotifications();
		}
	}

	async function handleNotificationClick(notification: any) {
		await notificationStore.markAsRead(notification.id);

		// Navigate based on notification type
		if (notification.type === 'friend_request') {
			goto('/friends');
		} else if (notification.type === 'battle_invite' || notification.type === 'battle_accept') {
			if (notification.referenceId) {
				goto(`/battle/${notification.referenceId}`);
			}
		}

		showDropdown = false;
	}

	async function markAllAsRead() {
		await notificationStore.markAllAsRead();
	}

	function formatTimeAgo(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
		return date.toLocaleDateString();
	}
</script>

<div class="notifications-container">
	<button class="notification-bell" on:click={toggleDropdown}>
		🔔
		{#if $notificationStore.unreadCount > 0}
			<span class="badge">{$notificationStore.unreadCount}</span>
		{/if}
	</button>

	{#if showDropdown}
		<div class="notification-dropdown">
			<div class="dropdown-header">
				<h3>Notifications</h3>
				{#if $notificationStore.notifications.length > 0}
					<button class="mark-all-btn" on:click={markAllAsRead}>Mark all read</button>
				{/if}
			</div>

			<div class="notifications-list">
				{#if $notificationStore.loading}
					<div class="loading">Loading...</div>
				{:else if $notificationStore.notifications.length === 0}
					<div class="empty-state">No notifications yet</div>
				{:else}
					{#each $notificationStore.notifications as notification (notification.id)}
						<div
							class="notification-item"
							class:unread={!notification.isRead}
							on:click={() => handleNotificationClick(notification)}
							on:keydown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
							role="button"
							tabindex="0"
						>
							<div class="notification-content">
								<div class="notification-icon">
									{#if notification.type === 'friend_request'}
										👥
									{:else if notification.type === 'battle_invite'}
										⚔️
									{:else if notification.type === 'battle_accept'}
										✅
									{:else if notification.type === 'friend_accept'}
										🤝
									{/if}
								</div>
								<div class="notification-text">
									<p class="notification-from">
										{notification.fromUserData?.name || 'Someone'}
									</p>
									<p class="notification-message">{notification.message}</p>
									<span class="notification-time">{formatTimeAgo(notification.createdAt)}</span>
								</div>
							</div>
							{#if !notification.isRead}
								<div class="unread-dot"></div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.notifications-container {
		position: relative;
	}

	.notification-bell {
		position: relative;
		background: transparent;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		transition: transform 0.2s;
	}

	.notification-bell:hover {
		transform: scale(1.1);
	}

	.badge {
		position: absolute;
		top: 0;
		right: 0;
		background-color: #f44336;
		color: white;
		border-radius: 10px;
		padding: 0.125rem 0.375rem;
		font-size: 0.75rem;
		font-weight: bold;
		min-width: 18px;
		text-align: center;
	}

	.notification-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.5rem;
		width: 380px;
		max-height: 500px;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		z-index: 1000;
		overflow: hidden;
	}

	.dropdown-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #eee;
	}

	.dropdown-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #333;
	}

	.mark-all-btn {
		background: transparent;
		border: none;
		color: #667eea;
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
	}

	.mark-all-btn:hover {
		text-decoration: underline;
	}

	.notifications-list {
		max-height: 400px;
		overflow-y: auto;
	}

	.loading,
	.empty-state {
		padding: 2rem;
		text-align: center;
		color: #666;
	}

	.notification-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #eee;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.notification-item:hover {
		background-color: #f5f5f5;
	}

	.notification-item.unread {
		background-color: #f0f4ff;
	}

	.notification-content {
		display: flex;
		gap: 0.75rem;
		flex: 1;
	}

	.notification-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.notification-text {
		flex: 1;
		min-width: 0;
	}

	.notification-from {
		margin: 0 0 0.25rem 0;
		font-weight: 600;
		color: #333;
		font-size: 0.875rem;
	}

	.notification-message {
		margin: 0 0 0.25rem 0;
		color: #666;
		font-size: 0.875rem;
	}

	.notification-time {
		font-size: 0.75rem;
		color: #999;
	}

	.unread-dot {
		width: 8px;
		height: 8px;
		background-color: #667eea;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
