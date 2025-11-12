<script lang="ts">
	import { api } from '$lib/api/api';
	import { authStore } from '$lib/stores/auth';

	let email = '';
	let loading = false;
	let error = '';
	let success = '';

	async function sendFriendRequest() {
		if (!email || !$authStore.token) return;

		loading = true;
		error = '';
		success = '';

		try {
			await api.friends.sendFriendRequest($authStore.token, email);
			success = `Friend request sent to ${email}!`;
			email = '';
		} catch (err: any) {
			error = err.message || 'Failed to send friend request';
		} finally {
			loading = false;
		}
	}
</script>

<div class="add-friend-container">
	<h2>Add Friend</h2>
	<form on:submit|preventDefault={sendFriendRequest}>
		<div class="form-group">
			<label for="email">Friend's Email</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				placeholder="Enter email address"
				required
				disabled={loading}
			/>
		</div>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		{#if success}
			<div class="success-message">{success}</div>
		{/if}

		<button type="submit" disabled={loading || !email}>
			{loading ? 'Sending...' : 'Send Friend Request'}
		</button>
	</form>
</div>

<style>
	.add-friend-container {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-width: 500px;
		margin: 0 auto;
	}

	h2 {
		margin-top: 0;
		color: #333;
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #555;
		font-weight: 500;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #4caf50;
	}

	input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

	button {
		width: 100%;
		padding: 0.75rem;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.3s;
	}

	button:hover:not(:disabled) {
		background-color: #45a049;
	}

	button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	.error-message {
		padding: 0.75rem;
		background-color: #ffebee;
		color: #c62828;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.success-message {
		padding: 0.75rem;
		background-color: #e8f5e9;
		color: #2e7d32;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
</style>
