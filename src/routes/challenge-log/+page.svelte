<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { api, type Challenge } from '$lib/api/api';

	let challenges: Challenge[] = [];
	let loading = true;
	let error = '';
	let filter: 'all' | 'completed' | 'incomplete' = 'all';

	onMount(async () => {
		await loadChallenges();
	});

	async function loadChallenges() {
		const token = $authStore.token;
		if (!token) {
			error = 'Please log in to view your challenge history';
			loading = false;
			return;
		}

		loading = true;
		error = '';

		try {
			challenges = await api.challenges.getAll(token);
			// Sort by most recent first
			challenges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		} catch (err: any) {
			console.error('Failed to load challenges:', err);
			error = err.message || 'Failed to load challenge history';
		} finally {
			loading = false;
		}
	}

	function resumeChallenge(challenge: Challenge) {
		// Save challenge to localStorage and navigate to challenge page
		const userId = $authStore.user?.id;
		const storageKey = userId ? `treasurehunt_challenge_${userId}` : 'treasurehunt_challenge';
		
		// Find first unfound item
		let currentItemIndex = 0;
		for (let i = 0; i < challenge.items.length; i++) {
			if (!challenge.items[i].found) {
				currentItemIndex = i;
				break;
			}
		}

		localStorage.setItem(
			storageKey,
			JSON.stringify({
				challenge,
				currentItemIndex,
				showStartForm: false
			})
		);

		// Navigate to challenge page
		goto('/challenge');
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getDuration(startDate: string, endDate?: string): string {
		const start = new Date(startDate);
		const end = endDate ? new Date(endDate) : new Date();
		const diffMs = end.getTime() - start.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		
		if (diffMins < 60) {
			return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
		}
		
		const hours = Math.floor(diffMins / 60);
		const mins = diffMins % 60;
		return `${hours}h ${mins}m`;
	}

	$: filteredChallenges = challenges.filter((c) => {
		if (filter === 'completed') return c.isCompleted;
		if (filter === 'incomplete') return !c.isCompleted;
		return true;
	});

	$: completedCount = challenges.filter((c) => c.isCompleted).length;
	$: incompleteCount = challenges.filter((c) => !c.isCompleted).length;
</script>

<svelte:head>
	<title>Challenge Log - Treasure Hunt</title>
</svelte:head>

<div class="challenge-log-container">
	<div class="header">
		<h1>Challenge Log</h1>
		<p class="subtitle">View and resume your treasure hunt challenges</p>
	</div>

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading your challenges...</p>
		</div>
	{:else if error}
		<div class="error-message">
			<p>{error}</p>
			{#if !$authStore.isAuthenticated}
				<button on:click={() => goto('/login')} class="primary-button">Go to Login</button>
			{:else}
				<button on:click={loadChallenges} class="secondary-button">Try Again</button>
			{/if}
		</div>
	{:else if challenges.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📋</div>
			<h2>No Challenges Yet</h2>
			<p>Start your first treasure hunt challenge!</p>
			<button on:click={() => goto('/challenge')} class="primary-button">Start Challenge</button>
		</div>
	{:else}
		<!-- Stats Summary -->
		<div class="stats-summary">
			<div class="stat-card total">
				<div class="stat-value">{challenges.length}</div>
				<div class="stat-label">Total Challenges</div>
			</div>
			<div class="stat-card completed">
				<div class="stat-value">{completedCount}</div>
				<div class="stat-label">Completed</div>
			</div>
			<div class="stat-card incomplete">
				<div class="stat-value">{incompleteCount}</div>
				<div class="stat-label">In Progress</div>
			</div>
		</div>

		<!-- Filter Buttons -->
		<div class="filter-buttons">
			<button
				class="filter-btn"
				class:active={filter === 'all'}
				on:click={() => (filter = 'all')}
			>
				All ({challenges.length})
			</button>
			<button
				class="filter-btn"
				class:active={filter === 'completed'}
				on:click={() => (filter = 'completed')}
			>
				Completed ({completedCount})
			</button>
			<button
				class="filter-btn"
				class:active={filter === 'incomplete'}
				on:click={() => (filter = 'incomplete')}
			>
				In Progress ({incompleteCount})
			</button>
		</div>

		<!-- Challenges List -->
		<div class="challenges-list">
			{#each filteredChallenges as challenge (challenge.id)}
				<div class="challenge-card" class:completed={challenge.isCompleted}>
					<div class="challenge-card-header">
						<div class="header-left">
							<span class="difficulty-badge difficulty-{challenge.difficulty}">
								{challenge.difficulty.toUpperCase()}
							</span>
							{#if challenge.isCompleted}
								<span class="status-badge completed-badge">✓ Completed</span>
							{:else}
								<span class="status-badge progress-badge">In Progress</span>
							{/if}
						</div>
						<div class="challenge-date">
							{formatDate(challenge.createdAt)}
						</div>
					</div>

					<div class="challenge-stats">
						<div class="stat-item">
							<div class="stat-icon">🎯</div>
							<div class="stat-info">
								<div class="stat-number">
									{challenge.completedItems}/{challenge.totalItems}
								</div>
								<div class="stat-text">Items Found</div>
							</div>
						</div>

						<div class="stat-item">
							<div class="stat-icon">⏱️</div>
							<div class="stat-info">
								<div class="stat-number">
									{getDuration(challenge.createdAt, challenge.completedAt)}
								</div>
								<div class="stat-text">Duration</div>
							</div>
						</div>

						<div class="stat-item">
							<div class="stat-icon">📊</div>
							<div class="stat-info">
								<div class="stat-number">
									{Math.round((challenge.completedItems / challenge.totalItems) * 100)}%
								</div>
								<div class="stat-text">Complete</div>
							</div>
						</div>
					</div>

					<!-- Progress Bar -->
					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: {(challenge.completedItems / challenge.totalItems) * 100}%"
						></div>
					</div>

					<!-- Items Preview -->
					<div class="items-preview">
						<div class="items-grid-preview">
							{#each challenge.items as item}
								<div class="preview-item" class:found={item.found} title={item.name}>
									{#if item.found}
										<span class="check-icon">✓</span>
									{:else}
										<span class="item-number">{item.itemId}</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="challenge-actions">
						{#if !challenge.isCompleted}
							<button on:click={() => resumeChallenge(challenge)} class="resume-button">
								Resume Challenge →
							</button>
						{:else}
							<button on:click={() => resumeChallenge(challenge)} class="view-button">
								View Details
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if filteredChallenges.length === 0}
			<div class="no-results">
				<p>No {filter === 'completed' ? 'completed' : 'in progress'} challenges found.</p>
			</div>
		{/if}
	{/if}

	<!-- Action Buttons -->
	<div class="bottom-actions">
		<button on:click={() => goto('/challenge')} class="primary-button">
			Start New Challenge
		</button>
		<button on:click={() => goto('/')} class="secondary-button">
			Back to Home
		</button>
	</div>
</div>

<style>
	.challenge-log-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		color: #666;
		font-size: 1.125rem;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		gap: 1rem;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid #f0f0f0;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-message {
		background: #ffebee;
		border: 2px solid #f44336;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
	}

	.error-message p {
		color: #c62828;
		font-size: 1.125rem;
		margin-bottom: 1.5rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 5rem;
		margin-bottom: 1.5rem;
	}

	.empty-state h2 {
		font-size: 2rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.empty-state p {
		color: #666;
		font-size: 1.125rem;
		margin-bottom: 2rem;
	}

	.stats-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		text-align: center;
		border: 3px solid transparent;
		transition: all 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
	}

	.stat-card.total {
		border-color: #667eea;
	}

	.stat-card.completed {
		border-color: #4caf50;
	}

	.stat-card.incomplete {
		border-color: #ff9800;
	}

	.stat-value {
		font-size: 3rem;
		font-weight: 800;
		color: #333;
		line-height: 1;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		color: #666;
		font-size: 1rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.filter-buttons {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: 0.75rem 1.5rem;
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		color: #666;
	}

	.filter-btn:hover {
		border-color: #667eea;
		color: #667eea;
	}

	.filter-btn.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-color: #667eea;
		color: white;
	}

	.challenges-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.challenge-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border: 3px solid #e0e0e0;
		transition: all 0.3s;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.challenge-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
		border-color: #667eea;
	}

	.challenge-card.completed {
		border-color: #4caf50;
	}

	.challenge-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.challenge-date {
		color: #666;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	.difficulty-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.difficulty-easy {
		background: #e8f5e9;
		color: #2e7d32;
	}

	.difficulty-medium {
		background: #fff3e0;
		color: #e65100;
	}

	.difficulty-hard {
		background: #ffebee;
		color: #c62828;
	}

	.status-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.completed-badge {
		background: #4caf50;
		color: white;
	}

	.progress-badge {
		background: #ff9800;
		color: white;
	}

	.challenge-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stat-icon {
		font-size: 1.5rem;
	}

	.stat-info {
		display: flex;
		flex-direction: column;
	}

	.stat-number {
		font-size: 1.125rem;
		font-weight: 700;
		color: #333;
		line-height: 1;
	}

	.stat-text {
		font-size: 0.75rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.progress-bar {
		height: 8px;
		background: #e0e0e0;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #4caf50, #8bc34a);
		transition: width 0.3s ease;
	}

	.items-preview {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 8px;
	}

	.items-grid-preview {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
		gap: 0.375rem;
	}

	.preview-item {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		transition: all 0.2s;
	}

	.preview-item.found {
		background: #4caf50;
		border-color: #4caf50;
		color: white;
	}

	.check-icon {
		font-size: 1rem;
	}

	.item-number {
		color: #999;
	}

	.challenge-actions {
		display: flex;
		gap: 0.75rem;
	}

	.resume-button {
		flex: 1;
		padding: 0.875rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-size: 0.875rem;
	}

	.resume-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.view-button {
		flex: 1;
		padding: 0.875rem;
		background: white;
		color: #667eea;
		border: 2px solid #667eea;
		border-radius: 8px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-size: 0.875rem;
	}

	.view-button:hover {
		background: #667eea;
		color: white;
	}

	.no-results {
		text-align: center;
		padding: 2rem;
		color: #666;
		font-size: 1.125rem;
	}

	.bottom-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 3rem;
		flex-wrap: wrap;
	}

	.primary-button {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.primary-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.secondary-button {
		padding: 1rem 2rem;
		background: white;
		color: #667eea;
		border: 2px solid #667eea;
		border-radius: 8px;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.secondary-button:hover {
		background: #667eea;
		color: white;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.challenge-log-container {
			padding: 1rem;
		}

		.header h1 {
			font-size: 2rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.stats-summary {
			grid-template-columns: 1fr;
		}

		.challenges-list {
			grid-template-columns: 1fr;
		}

		.challenge-stats {
			grid-template-columns: 1fr;
		}

		.stat-item {
			justify-content: center;
		}

		.filter-buttons {
			flex-direction: column;
		}

		.filter-btn {
			width: 100%;
		}

		.bottom-actions {
			flex-direction: column;
		}

		.primary-button,
		.secondary-button {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.header h1 {
			font-size: 1.75rem;
		}

		.stat-value {
			font-size: 2.5rem;
		}

		.challenge-card {
			padding: 1rem;
		}

		.challenge-card-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.items-grid-preview {
			grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
		}
	}
</style>
