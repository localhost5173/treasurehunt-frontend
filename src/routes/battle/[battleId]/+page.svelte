<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { api, type Battle, type Challenge } from '$lib/api/api';
	import BattleView from '$lib/components/BattleView.svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Skeleton } from '$lib/components/ui/skeleton';

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

<div class="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
	{#if loading}
		<div class="space-y-6">
			<Skeleton class="h-48 w-full" />
			<Skeleton class="h-32 w-full" />
			<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
				<Skeleton class="h-32 w-full" />
				<Skeleton class="h-32 w-full" />
				<Skeleton class="h-32 w-full" />
				<Skeleton class="h-32 w-full" />
			</div>
		</div>
	{:else if error}
		<Alert variant="destructive">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{:else if battle && $authStore.user}
		<BattleView {battle} currentUser={$authStore.user} />

		{#if battle.status === 'pending' && isOpponent}
			<Card class="mt-6">
				<CardHeader>
					<CardTitle>You've been challenged!</CardTitle>
					<CardDescription>Accept this battle to compete with your friend.</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="flex flex-wrap gap-3">
						<Button 
							variant="default" 
							size="lg" 
							onclick={acceptBattle} 
							disabled={acceptingBattle}
							class="flex-1 min-w-[150px]"
						>
							{acceptingBattle ? 'Accepting...' : '✓ Accept Battle'}
						</Button>
						<Button 
							variant="destructive" 
							size="lg" 
							onclick={declineBattle} 
							disabled={decliningBattle}
							class="flex-1 min-w-[150px]"
						>
							{decliningBattle ? 'Declining...' : '✗ Decline Battle'}
						</Button>
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if battle.status === 'active' && challenge}
			<Card class="mt-6">
				<CardHeader>
					<CardTitle>Your Challenge</CardTitle>
					<CardDescription>Find all the items to win the battle!</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{#each challenge.items as item (item.itemId)}
							<button
								class="cursor-pointer transition-all hover:shadow-lg text-left"
								onclick={() => !item.found && selectItem(item.itemId)}
								disabled={item.found}
							>
								<Card 
									class="{item.found ? 'bg-green-50 border-green-500' : ''} {selectedItemId === item.itemId ? 'border-primary bg-primary/5 shadow-md' : ''}"
								>
									<CardHeader class="p-4">
										<div class="flex items-center justify-between">
											<Badge variant="outline" class="text-xs">
												#{item.itemId}
											</Badge>
											{#if item.found}
												<Badge variant="default" class="bg-green-500">
													✓
												</Badge>
											{:else if selectedItemId === item.itemId}
												<Badge variant="default">
													📷
												</Badge>
											{/if}
										</div>
										<CardTitle class="text-base mt-2">{item.name}</CardTitle>
									</CardHeader>
								</Card>
							</button>
						{/each}
					</div>

					{#if selectedItemId !== null}
						<Alert class="mt-6 border-primary bg-primary/5">
							<AlertTitle class="text-primary">
								Find: {challenge.items.find((i) => i.itemId === selectedItemId)?.name}
							</AlertTitle>
							<AlertDescription>
								Take a photo of the item to verify you found it!
							</AlertDescription>
							<div class="mt-4">
								<Button variant="outline" onclick={() => (selectedItemId = null)}>
									Cancel Selection
								</Button>
							</div>
						</Alert>
					{/if}
				</CardContent>
			</Card>
		{/if}

		{#if battle.status === 'completed'}
			<div class="mt-6 text-center">
				<Button size="lg" onclick={() => goto('/friends')}>
					← Back to Friends
				</Button>
			</div>
		{/if}
	{/if}
</div>
