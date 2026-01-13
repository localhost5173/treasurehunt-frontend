<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { api, type Challenge } from '$lib/api/api';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { Separator } from '$lib/components/ui/separator';
	import { Spinner } from '$lib/components/ui/spinner';

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
			const data = await api.challenges.getAll(token);
			// Ensure we always have an array, even if API returns null/undefined
			challenges = Array.isArray(data) ? data : [];
			// Sort by most recent first
			if (challenges.length > 0) {
				challenges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
			}
		} catch (err: any) {
			console.error('Failed to load challenges:', err);
			error = err.message || 'Failed to load challenge history';
			// Ensure challenges is an empty array on error
			challenges = [];
		} finally {
			loading = false;
		}
	}

	function resumeChallenge(challenge: Challenge) {
		// If it's a battle challenge, navigate to the battle page
		if (challenge.battleId) {
			goto(`/battle/${challenge.battleId}`);
			return;
		}

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
		// If no end date, challenge is in progress
		if (!endDate) {
			return 'In Progress';
		}

		const start = new Date(startDate);
		const end = new Date(endDate);
		
		// Validate dates
		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			return 'N/A';
		}

		const diffMs = end.getTime() - start.getTime();
		
		// If negative duration, something is wrong
		if (diffMs < 0) {
			return 'N/A';
		}

		const diffMins = Math.floor(diffMs / 60000);
		
		if (diffMins < 1) {
			return '< 1 min';
		}
		
		if (diffMins < 60) {
			return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
		}
		
		const hours = Math.floor(diffMins / 60);
		const mins = diffMins % 60;
		
		if (hours < 24) {
			return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
		}
		
		const days = Math.floor(hours / 24);
		const remainingHours = hours % 24;
		return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
	}

	$: filteredChallenges = (challenges || []).filter((c) => {
		if (filter === 'completed') return c.isCompleted;
		if (filter === 'incomplete') return !c.isCompleted;
		return true;
	});

	$: completedCount = (challenges || []).filter((c) => c.isCompleted).length;
	$: incompleteCount = (challenges || []).filter((c) => !c.isCompleted).length;
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
		<Card class="loading-card">
			<CardContent class="loading-content">
				<Spinner class="spinner" />
				<p>Loading your challenges...</p>
			</CardContent>
		</Card>
	{:else if error}
		<Card class="error-card">
			<CardContent class="error-content">
				<p class="error-text">{error}</p>
				{#if !$authStore.isAuthenticated}
					<Button onclick={() => goto('/login')}>Go to Login</Button>
				{:else}
					<Button variant="secondary" onclick={loadChallenges}>Try Again</Button>
				{/if}
			</CardContent>
		</Card>
	{:else if challenges.length === 0}
		<Card class="empty-card">
			<CardContent class="empty-content">
				<div class="empty-icon">📋</div>
				<h2>No Challenges Yet</h2>
				<p>Start your first treasure hunt challenge!</p>
				<Button onclick={() => goto('/challenge')}>Start Challenge</Button>
			</CardContent>
		</Card>
	{:else}
		<!-- Stats Summary -->
		<div class="stats-grid">
			<Card class="stat-card">
				<CardContent class="stat-content">
					<div class="stat-value">{challenges.length}</div>
					<div class="stat-label">Total Challenges</div>
				</CardContent>
			</Card>
			<Card class="stat-card completed-card">
				<CardContent class="stat-content">
					<div class="stat-value">{completedCount}</div>
					<div class="stat-label">Completed</div>
				</CardContent>
			</Card>
			<Card class="stat-card incomplete-card">
				<CardContent class="stat-content">
					<div class="stat-value">{incompleteCount}</div>
					<div class="stat-label">In Progress</div>
				</CardContent>
			</Card>
		</div>

		<!-- Filter Buttons -->
		<div class="filter-buttons">
			<Button
				variant={filter === 'all' ? 'default' : 'outline'}
				onclick={() => (filter = 'all')}
			>
				All ({challenges.length})
			</Button>
			<Button
				variant={filter === 'completed' ? 'default' : 'outline'}
				onclick={() => (filter = 'completed')}
			>
				Completed ({completedCount})
			</Button>
			<Button
				variant={filter === 'incomplete' ? 'default' : 'outline'}
				onclick={() => (filter = 'incomplete')}
			>
				In Progress ({incompleteCount})
			</Button>
		</div>

		<!-- Challenges List -->
		<div class="challenges-list">
			{#each filteredChallenges as challenge (challenge.id)}
				<Card class="challenge-card">
					<CardHeader>
						<div class="card-header-content">
							<div class="badges">
								<Badge variant={
									challenge.difficulty === 'easy' ? 'secondary' :
									challenge.difficulty === 'medium' ? 'default' : 'destructive'
								}>
									{challenge.difficulty.toUpperCase()}
								</Badge>
								{#if challenge.battleId}
									<Badge>⚔️ Battle</Badge>
								{/if}
								{#if challenge.isCompleted}
									<Badge variant="outline" class="completed-badge">✓ Completed</Badge>
								{:else}
									<Badge variant="outline" class="progress-badge">In Progress</Badge>
								{/if}
							</div>
							<div class="challenge-date">
								{formatDate(challenge.createdAt)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
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
						<Progress value={(challenge.completedItems / challenge.totalItems) * 100} class="my-4" />

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

						<Separator class="my-4" />

						<!-- Action Buttons -->
						<div class="challenge-actions">
							{#if !challenge.isCompleted}
								<Button class="w-full" onclick={() => resumeChallenge(challenge)}>
									{challenge.battleId ? 'Go to Battle →' : 'Resume Challenge →'}
								</Button>
							{:else}
								<Button variant="secondary" class="w-full" onclick={() => resumeChallenge(challenge)}>
									{challenge.battleId ? 'View Battle' : 'View Details'}
								</Button>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>

		{#if filteredChallenges.length === 0}
			<Card>
				<CardContent class="no-results">
					<p>No {filter === 'completed' ? 'completed' : 'in progress'} challenges found.</p>
				</CardContent>
			</Card>
		{/if}
	{/if}

	<!-- Action Buttons -->
	<div class="bottom-actions">
		<Button size="lg" onclick={() => goto('/challenge')}>
			Start New Challenge
		</Button>
		<Button size="lg" variant="outline" onclick={() => goto('/')}>
			Back to Home
		</Button>
	</div>
</div>

<style>
	.challenge-log-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
	}

	/* HEADER AREA */
	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;

		/* Treasure gold gradient */
		background: linear-gradient(135deg, #f7d88a 0%, #e6b45f 50%, #c18a3a 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		color: #b9b4a8;
		font-size: 1.125rem;
	}

	/* LOADING / EMPTY / ERROR CARDS */
	:global(.loading-card),
	:global(.error-card),
	:global(.empty-card) {
		max-width: 600px;
		margin: 0 auto;
		background: rgba(240, 230, 210, 0.12);
		border: 1px solid rgba(255, 215, 140, 0.25);
		backdrop-filter: blur(10px);
		border-radius: 0.75rem;
	}

	:global(.loading-content),
	:global(.error-content),
	:global(.empty-content) {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		gap: 1.5rem;
		text-align: center;
	}

	:global(.spinner) {
		width: 50px;
		height: 50px;
	}

	/* ERROR COLORS → Rusty danger */
	:global(.error-card) {
		border: 2px solid #b44a3a;
		background: rgba(180, 70, 50, 0.12);
	}

	.error-text {
		color: #b44a3a;
		font-size: 1.125rem;
		margin: 0;
	}

	/* EMPTY STATE */
	.empty-icon {
		font-size: 5rem;
		color: #e8c88a;
	}

	:global(.empty-content) h2 {
		font-size: 2rem;
		margin: 0;
		color: #f5f1e5;
	}

	:global(.empty-content) p {
		color: #b9b4a8;
		font-size: 1.125rem;
		margin: 0;
	}

	/* STAT GRID */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	:global(.stat-card) {
		transition: all 0.2s;
		background: rgba(235, 215, 175, 0.08);
		border: 1px solid rgba(255, 215, 130, 0.25);
		backdrop-filter: blur(6px);
		border-radius: 0.75rem;
	}

	:global(.stat-card:hover) {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
	}

	:global(.stat-content) {
		text-align: center;
		padding: 2rem 1rem;
		color: #f5f1e5;
	}

	.stat-value {
		font-size: 3rem;
		font-weight: 800;
		line-height: 1;
		margin-bottom: 0.5rem;
		color: #ffd887;
	}

	.stat-label {
		color: #b9b4a8;
		font-size: 1rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	/* COMPLETED / INCOMPLETE CARDS */
	:global(.completed-card) {
		border: 2px solid #d3a64c; /* warm gold */
	}

	:global(.incomplete-card) {
		border: 2px solid #c4752f; /* bronze */
	}

	/* FILTER BUTTONS */
	.filter-buttons {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* CHALLENGE LIST GRID */
	.challenges-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	:global(.challenge-card) {
		transition: all 0.3s;
		background: rgba(240, 230, 210, 0.1);
		border: 1px solid rgba(230, 200, 140, 0.25);
		backdrop-filter: blur(8px);
		border-radius: 0.75rem;
		color: #f5f1e5;
	}

	:global(.challenge-card:hover) {
		transform: translateY(-4px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
	}

	.card-header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		width: 100%;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* BADGES */
	:global(.completed-badge) {
		background: #d3a64c;
		color: #2a1d0f;
		border-color: #d3a64c;
	}

	:global(.progress-badge) {
		background: #c4752f;
		color: #2a1d0f;
		border-color: #c4752f;
	}

	.challenge-date {
		color: #b9b4a8;
		font-size: 0.875rem;
		white-space: nowrap;
	}

	/* STAT BLOCK INSIDE CARDS */
	.challenge-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.stat-icon {
		font-size: 1.75rem;
		color: #e8c88a;
	}

	.stat-info {
		display: flex;
		flex-direction: column;
	}

	.stat-number {
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 1;
		color: #ffd887;
	}

	.stat-text {
		font-size: 0.75rem;
		color: #b9b4a8;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* ITEM PREVIEW GRID */
	.items-preview {
		background: rgba(235, 215, 175, 0.08);
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
		background: rgba(240, 230, 210, 0.15);
		border: 2px solid rgba(230, 200, 140, 0.3);
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		transition: all 0.2s;
		color: #f5f1e5;
	}

	.preview-item.found {
		background: #d3a64c;
		border-color: #d3a64c;
		color: #2a1d0f;
	}

	.check-icon {
		font-size: 1rem;
	}

	.item-number {
		color: #b9b4a8;
	}

	/* ACTIONS */
	.challenge-actions {
		display: flex;
		gap: 0.75rem;
	}

	:global(.no-results) {
		text-align: center;
		padding: 2rem;
	}

	:global(.no-results) p {
		color: #b9b4a8;
		font-size: 1.125rem;
		margin: 0;
	}

	.bottom-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 3rem;
		flex-wrap: wrap;
	}

	/* RESPONSIVE */
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

		.stats-grid {
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
			width: 100%;
		}

		.filter-buttons :global(button) {
			width: 100%;
		}

		.bottom-actions {
			flex-direction: column;
			width: 100%;
		}

		.bottom-actions :global(button) {
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

		.card-header-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.items-grid-preview {
			grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
		}
	}
</style>
