<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth';
	import { api } from '$lib/api/api';
	import Notifications from '$lib/components/Notifications.svelte';

	let { children } = $props();

	onMount(() => {
		authStore.checkAuth();
		
		// Update online status when user is active
		if ($authStore.token) {
			api.friends.updateOnlineStatus($authStore.token, true);
			
			// Update online status periodically
			const interval = setInterval(() => {
				if ($authStore.token) {
					api.friends.updateOnlineStatus($authStore.token, true);
				}
			}, 60000); // Every minute

			// Set offline when leaving
			return () => {
				clearInterval(interval);
				if ($authStore.token) {
					api.friends.updateOnlineStatus($authStore.token, false);
				}
			};
		}
	});

	function handleLogout() {
		if ($authStore.token) {
			api.friends.updateOnlineStatus($authStore.token, false);
		}
		authStore.logout();
		goto('/login');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if $authStore.isAuthenticated}
	<nav class="navbar">
		<div class="nav-container">
			<div class="nav-brand">
				<a href="/">🏴‍☠️ Treasure Hunt</a>
			</div>
			<div class="nav-links">
				<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
				<a href="/challenge" class:active={$page.url.pathname === '/challenge'}>Challenge</a>
				<a href="/challenge-log" class:active={$page.url.pathname === '/challenge-log'}>Challenge Log</a>
				<a href="/friends" class:active={$page.url.pathname === '/friends'}>Friends</a>
				<div class="nav-right">
					<Notifications />
					<span class="user-name">{$authStore.user?.name}</span>
					<button class="logout-btn" on:click={handleLogout}>Logout</button>
				</div>
			</div>
		</div>
	</nav>
{/if}

<main class="main-content">
	{@render children()}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	.navbar {
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.nav-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.nav-brand a {
		font-size: 1.5rem;
		font-weight: bold;
		color: #667eea;
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 2rem;
		flex: 1;
	}

	.nav-links a {
		color: #333;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.3s;
		padding: 0.5rem 1rem;
		border-radius: 4px;
	}

	.nav-links a:hover,
	.nav-links a.active {
		color: #667eea;
		background-color: rgba(102, 126, 234, 0.1);
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-left: auto;
	}

	.user-name {
		color: #666;
		font-weight: 500;
	}

	.logout-btn {
		padding: 0.5rem 1rem;
		background-color: #f44336;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: opacity 0.3s;
	}

	.logout-btn:hover {
		opacity: 0.9;
	}

	.main-content {
		min-height: calc(100vh - 80px);
	}

	@media (max-width: 768px) {
		.nav-container {
			flex-direction: column;
			padding: 1rem;
			gap: 1rem;
		}

		.nav-links {
			flex-direction: column;
			width: 100%;
			gap: 0.5rem;
		}

		.nav-links a {
			width: 100%;
			text-align: center;
		}

		.nav-right {
			width: 100%;
			justify-content: center;
			flex-wrap: wrap;
		}
	}
</style>
