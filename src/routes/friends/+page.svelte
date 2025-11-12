<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { api, type FriendRequest } from '$lib/api/api';
	import AddFriend from '$lib/components/AddFriend.svelte';
	import FriendsList from '$lib/components/FriendsList.svelte';

	let friendRequests: FriendRequest[] = [];
	let loading = true;
	let showChallengeModal = false;
	let selectedFriendId = '';
	let battleDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
	let battleItems = 5;
	let creatingBattle = false;

	onMount(async () => {
		if (!$authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		await loadFriendRequests();
	});

	async function loadFriendRequests() {
		if (!$authStore.token) return;

		try {
			friendRequests = await api.friends.getFriendRequests($authStore.token);
			loading = false;
		} catch (error) {
			console.error('Failed to load friend requests:', error);
			loading = false;
		}
	}

	async function acceptRequest(requestId: string) {
		if (!$authStore.token) return;

		try {
			await api.friends.acceptFriendRequest($authStore.token, requestId);
			await loadFriendRequests();
		} catch (error) {
			console.error('Failed to accept friend request:', error);
		}
	}

	async function rejectRequest(requestId: string) {
		if (!$authStore.token) return;

		try {
			await api.friends.rejectFriendRequest($authStore.token, requestId);
			await loadFriendRequests();
		} catch (error) {
			console.error('Failed to reject friend request:', error);
		}
	}

	function handleChallengeClick(friendId: string) {
		selectedFriendId = friendId;
		showChallengeModal = true;
	}

	async function createBattle() {
		if (!$authStore.token || !selectedFriendId) return;

		creatingBattle = true;
		try {
			const battle = await api.battles.createBattle($authStore.token, {
				opponentId: selectedFriendId,
				difficulty: battleDifficulty,
				totalItems: battleItems
			});
			showChallengeModal = false;
			goto(`/battle/${battle.id}`);
		} catch (error: any) {
			alert(error.message || 'Failed to create battle');
		} finally {
			creatingBattle = false;
		}
	}
</script>

<svelte:head>
	<title>Friends - Treasure Hunt</title>
</svelte:head>

<div class="friends-page">
	<div class="page-header">
		<h1>👥 Friends</h1>
	</div>

	{#if friendRequests.length > 0}
		<div class="friend-requests-section">
			<h2>Friend Requests</h2>
			<div class="requests-list">
				{#each friendRequests as request (request.id)}
					<div class="request-card">
						<div class="request-info">
							<strong>{request.fromUser?.name || 'Unknown'}</strong>
							<span class="request-email">{request.fromUser?.email || ''}</span>
						</div>
						<div class="request-actions">
							<button class="accept-btn" on:click={() => acceptRequest(request.id)}>
								Accept
							</button>
							<button class="reject-btn" on:click={() => rejectRequest(request.id)}>
								Decline
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="add-friend-section">
		<AddFriend />
	</div>

	<div class="friends-section">
		<FriendsList onChallengeClick={handleChallengeClick} />
	</div>
</div>

{#if showChallengeModal}
	<div class="modal-overlay" on:click={() => (showChallengeModal = false)} on:keydown={(e) => e.key === 'Escape' && (showChallengeModal = false)} role="presentation">
		<div class="modal" on:click|stopPropagation on:keydown role="dialog" aria-modal="true" tabindex="-1">
			<h2>⚔️ Create Battle Challenge</h2>

			<div class="form-group">
				<label for="difficulty">Difficulty</label>
				<select id="difficulty" bind:value={battleDifficulty}>
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
				</select>
			</div>

			<div class="form-group">
				<label for="items">Number of Items</label>
				<input
					id="items"
					type="number"
					bind:value={battleItems}
					min="3"
					max="20"
					step="1"
				/>
			</div>

			<div class="modal-actions">
				<button class="cancel-btn" on:click={() => (showChallengeModal = false)}>
					Cancel
				</button>
				<button class="create-btn" on:click={createBattle} disabled={creatingBattle}>
					{creatingBattle ? 'Creating...' : 'Create Battle'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.friends-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2.5rem;
		color: #333;
		margin: 0;
	}

	.friend-requests-section {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.friend-requests-section h2 {
		margin-top: 0;
		color: #333;
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	.requests-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.request-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.request-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.request-email {
		color: #666;
		font-size: 0.875rem;
	}

	.request-actions {
		display: flex;
		gap: 0.5rem;
	}

	.accept-btn,
	.reject-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: opacity 0.3s;
	}

	.accept-btn {
		background-color: #4caf50;
		color: white;
	}

	.accept-btn:hover {
		opacity: 0.9;
	}

	.reject-btn {
		background-color: #f44336;
		color: white;
	}

	.reject-btn:hover {
		opacity: 0.9;
	}

	.add-friend-section,
	.friends-section {
		margin-bottom: 2rem;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}

	.modal h2 {
		margin-top: 0;
		color: #333;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: #555;
		font-weight: 500;
	}

	.form-group select,
	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.cancel-btn,
	.create-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: opacity 0.3s;
	}

	.cancel-btn {
		background-color: #999;
		color: white;
	}

	.cancel-btn:hover {
		opacity: 0.9;
	}

	.create-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.create-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.create-btn:disabled {
		background: #cccccc;
		cursor: not-allowed;
	}
</style>
