<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { api, type Battle, type Challenge } from '$lib/api/api';
	import BattleView from '$lib/components/BattleView.svelte';

	let battle: Battle | null = null;
	let challenge: Challenge | null = null;
	let loading = true;
	let error = '';
	let acceptingBattle = false;
	let decliningBattle = false;
	let selectedItemId: number | null = null;

	$: battleId = $page.params.battleId || '';
	$: isOpponent = battle && battle.opponentId === $authStore.user?.id;
	$: myParticipant = battle?.participants.find((p) => p.userId === $authStore.user?.id);

	onMount(() => {
		if (!$authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		loadBattle();
		// Poll for battle updates every 5 seconds
		const interval = setInterval(loadBattle, 5000);
		return () => clearInterval(interval);
	});

	async function loadBattle() {
		if (!$authStore.token) return;

		try {
			battle = await api.battles.getBattle($authStore.token, battleId);
			
			// If battle is active and user has accepted, load/create challenge
			if (battle.status === 'active' && myParticipant?.hasAccepted) {
				// Check if challengeId exists and is not the zero ObjectID
				const hasValidChallengeId = myParticipant.challengeId && 
					myParticipant.challengeId !== '000000000000000000000000';
				
				if (hasValidChallengeId && myParticipant.challengeId) {
					challenge = await api.challenges.getById($authStore.token, myParticipant.challengeId);
				} else {
					// Join the battle (creates a challenge)
					challenge = await api.battles.joinBattle($authStore.token, battleId);
				}
			}
			
			loading = false;
		} catch (err: any) {
			error = err.message || 'Failed to load battle';
			loading = false;
		}
	}

	async function acceptBattle() {
		if (!$authStore.token) return;

		acceptingBattle = true;
		try {
			await api.battles.acceptBattle($authStore.token, battleId);
			// Join the battle to create the challenge
			const newChallenge = await api.battles.joinBattle($authStore.token, battleId);
			// Navigate to challenge page with battle context
			goto(`/challenge?battleId=${battleId}`);
		} catch (err: any) {
			alert(err.message || 'Failed to accept battle');
			acceptingBattle = false;
		}
	}

	async function declineBattle() {
		if (!$authStore.token || !confirm('Are you sure you want to decline this battle?')) return;

		decliningBattle = true;
		try {
			await api.battles.declineBattle($authStore.token, battleId);
			goto('/friends');
		} catch (err: any) {
			alert(err.message || 'Failed to decline battle');
		} finally {
			decliningBattle = false;
		}
	}

	function selectItem(itemId: number) {
		if (!challenge) return;
		const item = challenge.items.find((i) => i.itemId === itemId);
		if (item && !item.found) {
			// Navigate to the challenge page with battle context and specific item
			goto(`/challenge?battleId=${battleId}&itemId=${itemId}`);
		}
	}
</script>

<svelte:head>
	<title>Battle - Treasure Hunt</title>
</svelte:head>

<div class="battle-page">
	{#if loading}
		<div class="loading">Loading battle...</div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else if battle && $authStore.user}
		<BattleView {battle} currentUser={$authStore.user} />

		{#if battle.status === 'pending' && isOpponent}
			<div class="pending-actions">
				<h3>You've been challenged!</h3>
				<p>Accept this battle to compete with your friend.</p>
				<div class="action-buttons">
					<button class="accept-btn" on:click={acceptBattle} disabled={acceptingBattle}>
						{acceptingBattle ? 'Accepting...' : '✓ Accept Battle'}
					</button>
					<button class="decline-btn" on:click={declineBattle} disabled={decliningBattle}>
						{decliningBattle ? 'Declining...' : '✗ Decline Battle'}
					</button>
				</div>
			</div>
		{/if}

		{#if battle.status === 'active' && challenge}
			<div class="challenge-section">
				<h2>Your Challenge</h2>
				<div class="items-grid">
					{#each challenge.items as item (item.itemId)}
						<div
							class="item-card"
							class:found={item.found}
							class:selected={selectedItemId === item.itemId}
							on:click={() => !item.found && selectItem(item.itemId)}
							on:keydown={(e) => e.key === 'Enter' && !item.found && selectItem(item.itemId)}
							role="button"
							tabindex="0"
						>
							<div class="item-number">{item.itemId}</div>
							<div class="item-name">{item.name}</div>
							{#if item.found}
								<div class="found-badge">✓ Found</div>
							{:else if selectedItemId === item.itemId}
								<div class="selected-badge">📷 Selected</div>
							{/if}
						</div>
					{/each}
				</div>

				{#if selectedItemId !== null}
					<div class="upload-section">
						<h3>Find: {challenge.items.find((i) => i.itemId === selectedItemId)?.name}</h3>
						<p>Take a photo of the item to verify you found it!</p>
						<button class="cancel-selection" on:click={() => (selectedItemId = null)}>
							Cancel
						</button>
					</div>
				{/if}
			</div>
		{/if}

		{#if battle.status === 'completed'}
			<div class="completed-section">
				<button class="back-btn" on:click={() => goto('/friends')}>
					← Back to Friends
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.battle-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.loading,
	.error-message {
		text-align: center;
		padding: 3rem;
		font-size: 1.25rem;
	}

	.error-message {
		color: #f44336;
	}

	.pending-actions {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		margin-top: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.pending-actions h3 {
		margin-top: 0;
		color: #333;
		font-size: 1.5rem;
	}

	.pending-actions p {
		color: #666;
		margin-bottom: 1.5rem;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.accept-btn,
	.decline-btn {
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.3s;
	}

	.accept-btn {
		background-color: #4caf50;
		color: white;
	}

	.accept-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.decline-btn {
		background-color: #f44336;
		color: white;
	}

	.decline-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.accept-btn:disabled,
	.decline-btn:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	.challenge-section {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		margin-top: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.challenge-section h2 {
		margin-top: 0;
		color: #333;
		font-size: 1.75rem;
		margin-bottom: 1.5rem;
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.item-card {
		background: #f8f9fa;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s;
	}

	.item-card:hover:not(.found) {
		border-color: #667eea;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.item-card.found {
		background: #e8f5e9;
		border-color: #4caf50;
		cursor: default;
	}

	.item-card.selected {
		border-color: #667eea;
		background: #e8eaf6;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.item-number {
		font-size: 0.875rem;
		color: #999;
		margin-bottom: 0.5rem;
	}

	.item-name {
		font-weight: 600;
		color: #333;
		margin-bottom: 0.5rem;
		text-transform: capitalize;
	}

	.found-badge {
		color: #4caf50;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.selected-badge {
		color: #667eea;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.upload-section {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 2rem;
		border: 2px dashed #667eea;
		text-align: center;
	}

	.upload-section h3 {
		margin-top: 0;
		color: #667eea;
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.upload-section p {
		color: #666;
		margin-bottom: 1rem;
	}

	.cancel-selection {
		padding: 0.5rem 1.5rem;
		background-color: #999;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
	}

	.cancel-selection:hover {
		background-color: #777;
	}

	.completed-section {
		margin-top: 2rem;
		text-align: center;
	}

	.back-btn {
		padding: 0.75rem 2rem;
		background-color: #667eea;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.3s;
	}

	.back-btn:hover {
		opacity: 0.9;
	}
</style>
