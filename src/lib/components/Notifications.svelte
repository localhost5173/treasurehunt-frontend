<script lang="ts">
	import { notificationStore } from '$lib/stores/notifications';
	import { authStore } from '$lib/stores/auth';
	import { api } from '$lib/api/api';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		Popover,
		PopoverContent,
		PopoverTrigger
	} from '$lib/components/ui/popover';
	import { Separator } from '$lib/components/ui/separator';

	let showDropdown = $state(false);

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

	$effect(() => {
		if (showDropdown) {
			notificationStore.fetchNotifications();
		}
	});

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

	function getNotificationIcon(type: string): string {
		switch (type) {
			case 'friend_request': return '👥';
			case 'battle_invite': return '⚔️';
			case 'battle_accept': return '✅';
			case 'friend_accept': return '🤝';
			default: return '📬';
		}
	}
</script>

<Popover bind:open={showDropdown}>
	<PopoverTrigger class="relative">
		<button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 relative">
			<span class="text-xl">🔔</span>
			{#if $notificationStore.unreadCount > 0}
				<Badge 
					variant="destructive" 
					class="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
				>
					{$notificationStore.unreadCount}
				</Badge>
			{/if}
		</button>
	</PopoverTrigger>
	<PopoverContent class="w-[calc(100vw-2rem)] max-w-[380px] p-0" align="end" sideOffset={8}>
		<div class="flex items-center justify-between p-4 border-b">
			<h3 class="font-semibold text-base">Notifications</h3>
			{#if $notificationStore.notifications.length > 0}
				<Button variant="ghost" size="sm" onclick={markAllAsRead} class="h-auto p-1 text-xs">
					Mark all read
				</Button>
			{/if}
		</div>

		<ScrollArea class="h-[min(400px,60vh)]">
			<div class="flex flex-col">
				{#if $notificationStore.loading}
					<div class="p-8 text-center text-sm text-muted-foreground">
						Loading...
					</div>
				{:else if $notificationStore.notifications.length === 0}
					<div class="p-8 text-center text-sm text-muted-foreground">
						No notifications yet
					</div>
				{:else}
					{#each $notificationStore.notifications as notification (notification.id)}
						<button
							class="flex items-start gap-3 p-3 text-left transition-colors hover:bg-muted border-b last:border-b-0 {!notification.isRead ? 'bg-primary/5' : ''}"
							onclick={() => handleNotificationClick(notification)}
						>
							<div class="text-2xl flex-shrink-0 mt-1">
								{getNotificationIcon(notification.type)}
							</div>
							<div class="flex-1 min-w-0 space-y-1">
								<p class="text-sm font-semibold text-foreground truncate">
									{notification.fromUserData?.name || 'Someone'}
								</p>
								<p class="text-sm text-muted-foreground line-clamp-2">
									{notification.message}
								</p>
								<span class="text-xs text-muted-foreground">
									{formatTimeAgo(notification.createdAt)}
								</span>
							</div>
							{#if !notification.isRead}
								<div class="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</ScrollArea>
	</PopoverContent>
</Popover>
