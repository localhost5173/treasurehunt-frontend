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
	<!-- Mobile & Desktop Navigation -->
	<nav class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="container flex h-16 items-center px-4">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 text-xl font-bold text-primary mr-4">
				<span class="text-2xl">🏴‍☠️</span>
				<span class="hidden sm:inline">Treasure Hunt</span>
				<span class="sm:hidden">TH</span>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex md:flex-1 md:items-center md:gap-6">
				<Button 
					variant={isActive('/') ? 'default' : 'ghost'} 
					size="sm"
					onclick={() => navigateTo('/')}
				>
					Home
				</Button>
				<Button 
					variant={isActive('/challenge') ? 'default' : 'ghost'} 
					size="sm"
					onclick={() => navigateTo('/challenge')}
				>
					Challenge
				</Button>
				<Button 
					variant={isActive('/challenge-log') ? 'default' : 'ghost'} 
					size="sm"
					onclick={() => navigateTo('/challenge-log')}
				>
					Log
				</Button>
				<Button 
					variant={isActive('/friends') ? 'default' : 'ghost'} 
					size="sm"
					onclick={() => navigateTo('/friends')}
				>
					Friends
				</Button>

				<!-- Right side items -->
				<div class="ml-auto flex items-center gap-3">
					<Notifications />
					<Badge variant="secondary" class="hidden lg:flex">
						{$authStore.user?.name}
					</Badge>
					<Button variant="destructive" size="sm" onclick={handleLogout}>
						Logout
					</Button>
				</div>
			</div>

			<!-- Mobile Menu Button -->
			<div class="flex flex-1 items-center justify-end gap-2 md:hidden">
				<Notifications />
				<Sheet bind:open={mobileMenuOpen}>
					<SheetTrigger>
						<Button variant="ghost" size="icon">
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
										👤 {$authStore.user.name}
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
								<span class="mr-2">🏠</span> Home
							</Button>
							<Button 
								variant={isActive('/challenge') ? 'default' : 'outline'} 
								size="lg"
								class="justify-start max-w-full"
								onclick={() => navigateTo('/challenge')}
							>
								<span class="mr-2">🎮</span> Challenge
							</Button>
							<Button 
								variant={isActive('/challenge-log') ? 'default' : 'outline'} 
								size="lg"
								class="justify-start max-w-full"
								onclick={() => navigateTo('/challenge-log')}
							>
								<span class="mr-2">📜</span> Challenge Log
							</Button>
							<Button 
								variant={isActive('/friends') ? 'default' : 'outline'} 
								size="lg"
								class="justify-start max-w-full"
								onclick={() => navigateTo('/friends')}
							>
								<span class="mr-2">👥</span> Friends
							</Button>
							
							<Separator class="my-2" />
							
							<Button 
								variant="destructive" 
								size="lg"
								class="justify-start max-w-full"
								onclick={handleLogout}
							>
								<span class="mr-2">🚪</span> Logout
							</Button>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	</nav>
{/if}

<main class="min-h-[calc(100vh-4rem)]">
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
