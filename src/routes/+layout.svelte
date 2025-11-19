<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth';
	import { api } from '$lib/api/api';
	import Notifications from '$lib/components/Notifications.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';

	let { children } = $props();
	let mobileMenuOpen = $state(false);

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
		mobileMenuOpen = false;
	}

	function navigateTo(path: string) {
		goto(path);
		mobileMenuOpen = false;
	}

	function isActive(path: string): boolean {
		return $page.url.pathname === path;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if $authStore.isAuthenticated}
	<!-- Floating Notifications Button (Top Left) -->
	<div class="fixed top-4 left-4 z-50">
		<div class="floating-button">
			<Notifications />
		</div>
	</div>

	<!-- Desktop Navigation (Left Side) -->
	<div class="hidden md:flex fixed left-4 top-20 z-50 flex-col gap-3">
		<Button 
			variant={isActive('/') ? 'default' : 'secondary'} 
			size="icon"
			class="floating-button"
			onclick={() => navigateTo('/')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
				<polyline points="9 22 9 12 15 12 15 22"/>
			</svg>
			<span class="sr-only">Home</span>
		</Button>
		<Button 
			variant={isActive('/challenge') ? 'default' : 'secondary'} 
			size="icon"
			class="floating-button"
			onclick={() => navigateTo('/challenge')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M17.5 7.5a5 5 0 1 0-9 0L6 14"/>
				<path d="M18 14a5 5 0 1 0-11.9 0"/>
				<path d="M9.7 17.7a5 5 0 0 0 4.6 0"/>
			</svg>
			<span class="sr-only">Challenge</span>
		</Button>
		<Button 
			variant={isActive('/challenge-log') ? 'default' : 'secondary'} 
			size="icon"
			class="floating-button"
			onclick={() => navigateTo('/challenge-log')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
				<polyline points="14 2 14 8 20 8"/>
				<line x1="16" x2="8" y1="13" y2="13"/>
				<line x1="16" x2="8" y1="17" y2="17"/>
				<line x1="10" x2="8" y1="9" y2="9"/>
			</svg>
			<span class="sr-only">Challenge Log</span>
		</Button>
		<Button 
			variant={isActive('/friends') ? 'default' : 'secondary'} 
			size="icon"
			class="floating-button"
			onclick={() => navigateTo('/friends')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
				<circle cx="9" cy="7" r="4"/>
				<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
				<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
			</svg>
			<span class="sr-only">Friends</span>
		</Button>
		<Button 
			variant="destructive" 
			size="icon"
			class="floating-button mt-2"
			onclick={handleLogout}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
				<polyline points="16 17 21 12 16 7"/>
				<line x1="21" x2="9" y1="12" y2="12"/>
			</svg>
			<span class="sr-only">Logout</span>
		</Button>
	</div>

	<!-- Floating Burger Menu (Top Right) -->
	<div class="fixed top-4 right-4 z-50 md:hidden">
		<Sheet bind:open={mobileMenuOpen}>
			<SheetTrigger>
				<Button variant="secondary" size="icon" class="floating-button">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="4" x2="20" y1="12" y2="12" />
						<line x1="4" x2="20" y1="6" y2="6" />
						<line x1="4" x2="20" y1="18" y2="18" />
					</svg>
					<span class="sr-only">Toggle menu</span>
				</Button>
			</SheetTrigger>
			<SheetContent side="right" class="w-[300px] sm:w-[400px]">
				<SheetHeader>
					<SheetTitle>Navigation</SheetTitle>
					<SheetDescription>
						{#if $authStore.user}
							<Badge variant="secondary" class="mt-2">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
									<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
									<circle cx="12" cy="7" r="4"/>
								</svg>
								{$authStore.user.name}
							</Badge>
						{/if}
					</SheetDescription>
				</SheetHeader>
				<div class="flex flex-col gap-3 mt-6 px-4">
					<Button 
						variant={isActive('/') ? 'default' : 'outline'} 
						size="lg"
						class="justify-start max-w-full"
						onclick={() => navigateTo('/')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
							<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
							<polyline points="9 22 9 12 15 12 15 22"/>
						</svg>
						Home
					</Button>
					<Button 
						variant={isActive('/challenge') ? 'default' : 'outline'} 
						size="lg"
						class="justify-start max-w-full"
						onclick={() => navigateTo('/challenge')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
							<path d="M17.5 7.5a5 5 0 1 0-9 0L6 14"/>
							<path d="M18 14a5 5 0 1 0-11.9 0"/>
							<path d="M9.7 17.7a5 5 0 0 0 4.6 0"/>
						</svg>
						Challenge
					</Button>
					<Button 
						variant={isActive('/challenge-log') ? 'default' : 'outline'} 
						size="lg"
						class="justify-start max-w-full"
						onclick={() => navigateTo('/challenge-log')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
							<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
							<polyline points="14 2 14 8 20 8"/>
							<line x1="16" x2="8" y1="13" y2="13"/>
							<line x1="16" x2="8" y1="17" y2="17"/>
							<line x1="10" x2="8" y1="9" y2="9"/>
						</svg>
						Challenge Log
					</Button>
					<Button 
						variant={isActive('/friends') ? 'default' : 'outline'} 
						size="lg"
						class="justify-start max-w-full"
						onclick={() => navigateTo('/friends')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
						</svg>
						Friends
					</Button>
					
					<Separator class="my-2" />
					
					<Button 
						variant="destructive" 
						size="lg"
						class="justify-start max-w-full"
						onclick={handleLogout}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
							<polyline points="16 17 21 12 16 7"/>
							<line x1="21" x2="9" y1="12" y2="12"/>
						</svg>
						Logout
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	</div>
{/if}

<main class="min-h-screen">
	{@render children()}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%);
		min-height: 100vh;
	}

	:global(.floating-button) {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(10px);
		transition: all 0.2s ease;
	}

	:global(.floating-button:hover) {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
	}

	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
