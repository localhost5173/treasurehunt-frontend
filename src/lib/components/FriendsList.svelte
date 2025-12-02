<script lang="ts">
	import { api, type Friend } from '$lib/api/api';
	import { authStore } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	export let onChallengeClick: (friendId: string) => void = () => {};

	let friends: Friend[] = [];
	let loading = true;
	let error = '';

	onMount(() => {
		loadFriends();
		// Poll for online status updates every 30 seconds
		const interval = setInterval(loadFriends, 30000);
		
		// Listen for WebSocket friend list updates
		const handleRefresh = () => {
			console.log('Refreshing friends list...');
			loadFriends();
		};
		window.addEventListener('refresh-friends', handleRefresh);
		
		return () => {
			clearInterval(interval);
			window.removeEventListener('refresh-friends', handleRefresh);
		};
	});

	async function loadFriends() {
		if (!$authStore.token) return;

		try {
			friends = await api.friends.getFriends($authStore.token);
			loading = false;
		} catch (err: any) {
			error = err.message || 'Failed to load friends';
			loading = false;
		}
	}

	function handleChallengeClick(friend: Friend) {
		onChallengeClick(friend.user.id);
	}
</script>

<div class="friends-list-container">
	<h2>Your Friends</h2>

	{#if loading}
		<div class="loading">Loading friends...</div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else if friends.length === 0}
		<div class="empty-state">
			<p>You don't have any friends yet.</p>
			<p>Add friends by their email address to start battling!</p>
		</div>
	{:else}
		<div class="friends-grid">
			{#each friends as friend (friend.friendId)}
				<div class="friend-card">
					<div class="friend-header">
						<div class="friend-info">
							{#if friend.user.profileImage}
								<img src={friend.user.profileImage} alt={friend.user.name} class="profile-pic" />
							{:else}
								<div class="profile-pic-placeholder">
									{friend.user.name.charAt(0).toUpperCase()}
								</div>
							{/if}
							<div class="friend-details">
								<h3>{friend.user.name}</h3>
								<p class="friend-email">{friend.user.email}</p>
								<span class="online-status" class:online={friend.isOnline}>
									{friend.isOnline ? '🟢 Online' : '⚫ Offline'}
								</span>
							</div>
						</div>
					</div>
					<div class="friend-actions">
						<button
							class="challenge-btn"
							on:click={() => handleChallengeClick(friend)}
							disabled={!friend.isOnline}
						>
							⚔️ Challenge to Battle
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.friends-list-container {
		padding: 1rem;
	}

	h2 {
		color: #333;
		font-size: 1.75rem;
		margin-bottom: 1.5rem;
	}

	.loading,
	.error-message {
		padding: 1rem;
		text-align: center;
		border-radius: 4px;
	}

	.loading {
		color: #666;
	}

	.error-message {
		background-color: #ffebee;
		color: #c62828;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #666;
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.friends-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.friend-card {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.3s;
	}

	.friend-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.friend-header {
		margin-bottom: 1rem;
	}

	.friend-info {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.profile-pic {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		object-fit: cover;
	}

	.profile-pic-placeholder {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: bold;
	}

	.friend-details {
		flex: 1;
	}

	.friend-details h3 {
		margin: 0 0 0.25rem 0;
		color: #333;
		font-size: 1.25rem;
	}

	.friend-email {
		margin: 0 0 0.5rem 0;
		color: #666;
		font-size: 0.875rem;
	}

	.online-status {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		background-color: #f5f5f5;
		color: #666;
	}

	.online-status.online {
		background-color: #e8f5e9;
		color: #2e7d32;
	}

	.friend-actions {
		display: flex;
		gap: 0.5rem;
	}

	.challenge-btn {
		flex: 1;
		padding: 0.75rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		font-weight: 500;
		transition: opacity 0.3s;
	}

	.challenge-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.challenge-btn:disabled {
		background: #cccccc;
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
