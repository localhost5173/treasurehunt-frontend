<script lang="ts">
	import { api, type Battle, type User } from '$lib/api/api';
	import { authStore } from '$lib/stores/auth';

	export let battle: Battle;
	export let currentUser: User;

	$: myParticipant = battle.participants.find((p) => p.userId === currentUser.id);
	$: opponentParticipant = battle.participants.find((p) => p.userId !== currentUser.id);
	$: isChallenger = battle.challengerId === currentUser.id;
	$: opponent = isChallenger ? battle.opponent : battle.challenger;
	$: myProgress = myParticipant ? (myParticipant.completedItems / battle.totalItems) * 100 : 0;
	$: opponentProgress = opponentParticipant
		? (opponentParticipant.completedItems / battle.totalItems) * 100
		: 0;
	$: isWinner = battle.winnerId === currentUser.id;
	$: opponentIsWinner = battle.winnerId && battle.winnerId !== currentUser.id;

	function getStatusText(): string {
		if (battle.status === 'pending') {
			return isChallenger ? 'Waiting for opponent to accept...' : 'You have been challenged!';
		} else if (battle.status === 'active') {
			return 'Battle in progress!';
		} else if (battle.status === 'completed') {
			if (isWinner) return '🎉 You won!';
			if (opponentIsWinner) return '💔 You lost';
			return 'Battle completed';
		} else if (battle.status === 'declined') {
			return 'Battle declined';
		}
		return '';
	}

	function getStatusColor(): string {
		if (battle.status === 'pending') return '#ff9800';
		if (battle.status === 'active') return '#2196f3';
		if (battle.status === 'completed') {
			if (isWinner) return '#4caf50';
			return '#f44336';
		}
		return '#999';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}
</script>

<div class="battle-view">
	<div class="battle-header">
		<h2>⚔️ Battle Challenge</h2>
		<div class="battle-status" style="background-color: {getStatusColor()}">
			{getStatusText()}
		</div>
	</div>

	<div class="battle-info">
		<div class="info-item">
			<span class="label">Difficulty:</span>
			<span class="value difficulty-{battle.difficulty}">{battle.difficulty.toUpperCase()}</span>
		</div>
		<div class="info-item">
			<span class="label">Items to find:</span>
			<span class="value">{battle.totalItems}</span>
		</div>
		<div class="info-item">
			<span class="label">Started:</span>
			<span class="value">{formatDate(battle.createdAt)}</span>
		</div>
	</div>

	<div class="players-container">
		<div class="player-card" class:winner={isWinner}>
			<div class="player-header">
				<h3>You</h3>
				{#if isWinner}
					<span class="winner-badge">👑 Winner</span>
				{/if}
			</div>
			<div class="player-name">{currentUser.name}</div>
			<div class="progress-container">
				<div class="progress-bar">
					<div class="progress-fill" style="width: {myProgress}%"></div>
				</div>
				<div class="progress-text">
					{myParticipant?.completedItems || 0} / {battle.totalItems}
				</div>
			</div>
			{#if myParticipant?.isCompleted}
				<div class="completed-badge">✓ Completed!</div>
			{/if}
		</div>

		<div class="vs-divider">VS</div>

		<div class="player-card" class:winner={opponentIsWinner}>
			<div class="player-header">
				<h3>Opponent</h3>
				{#if opponentIsWinner}
					<span class="winner-badge">👑 Winner</span>
				{/if}
			</div>
			<div class="player-name">{opponent?.name || 'Unknown'}</div>
			<div class="progress-container">
				<div class="progress-bar">
					<div class="progress-fill opponent" style="width: {opponentProgress}%"></div>
				</div>
				<div class="progress-text">
					{opponentParticipant?.completedItems || 0} / {battle.totalItems}
				</div>
			</div>
			{#if opponentParticipant?.isCompleted}
				<div class="completed-badge">✓ Completed!</div>
			{/if}
		</div>
	</div>

	{#if battle.status === 'completed' && battle.completedAt}
		<div class="battle-completed-info">
			Battle completed on {formatDate(battle.completedAt)}
		</div>
	{/if}
</div>

<style>
	.battle-view {
		background: rgb(255, 255, 255);
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.battle-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.battle-header h2 {
		margin: 0;
		color: #333;
		font-size: 1.75rem;
	}

	.battle-status {
		padding: 0.5rem 1rem;
		border-radius: 20px;
		color: white;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.battle-info {
		display: flex;
		gap: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.875rem;
		color: #666;
	}

	.value {
		font-weight: 600;
		color: #333;
	}

	.difficulty-easy {
		color: #4caf50;
	}

	.difficulty-medium {
		color: #ff9800;
	}

	.difficulty-hard {
		color: #f44336;
	}

	.players-container {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 2rem;
		align-items: center;
		margin-bottom: 2rem;
	}

	@media (max-width: 768px) {
		.players-container {
			grid-template-columns: 1fr;
		}

		.vs-divider {
			text-align: center;
		}
	}

	.player-card {
		background: #9e4a4a;
		border-radius: 8px;
		padding: 1.5rem;
		border: 2px solid transparent;
		transition: all 0.3s;
	}

	.player-card.winner {
		border-color: #ffd700;
		background: linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%);
	}

	.player-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.player-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.125rem;
	}

	.winner-badge {
		font-size: 0.875rem;
		background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-weight: 600;
	}

	.player-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: #667eea;
		margin-bottom: 1rem;
	}

	.progress-container {
		margin-bottom: 1rem;
	}

	.progress-bar {
		height: 24px;
		background-color: #e0e0e0;
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		transition: width 0.5s ease;
	}

	.progress-fill.opponent {
		background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
	}

	.progress-text {
		text-align: center;
		font-weight: 600;
		color: #333;
	}

	.completed-badge {
		background-color: #4caf50;
		color: white;
		padding: 0.5rem;
		border-radius: 4px;
		text-align: center;
		font-weight: 600;
	}

	.vs-divider {
		font-size: 2rem;
		font-weight: bold;
		color: #667eea;
		text-align: center;
	}

	.battle-completed-info {
		text-align: center;
		padding: 1rem;
		background-color: #e8f5e9;
		border-radius: 4px;
		color: #2e7d32;
		font-size: 0.875rem;
	}
</style>
