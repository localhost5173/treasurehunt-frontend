<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { api, type FriendRequest } from '$lib/api/api';
	import AddFriend from '$lib/components/AddFriend.svelte';
	import FriendsList from '$lib/components/FriendsList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Separator } from '$lib/components/ui/separator';

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

<div class="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
	<div class="mb-6 md:mb-8">
		<h1 class="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
			<span>👥</span>
			<span>Friends</span>
		</h1>
	</div>

	{#if friendRequests.length > 0}
		<Card class="mb-6">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<span>📬</span>
					<span>Friend Requests</span>
					<Badge variant="secondary">{friendRequests.length}</Badge>
				</CardTitle>
				<CardDescription>Accept or decline friend requests</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each friendRequests as request (request.id)}
						<Card class="bg-muted">
							<CardContent class="p-4">
								<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
									<div class="flex-1 min-w-0">
										<p class="font-semibold text-base truncate">
											{request.fromUser?.name || 'Unknown'}
										</p>
										<p class="text-sm text-muted-foreground truncate">
											{request.fromUser?.email || ''}
										</p>
									</div>
									<div class="flex gap-2">
										<Button 
											variant="default" 
											size="sm"
											onclick={() => acceptRequest(request.id)}
											class="flex-1 sm:flex-none"
										>
											Accept
										</Button>
										<Button 
											variant="destructive" 
											size="sm"
											onclick={() => rejectRequest(request.id)}
											class="flex-1 sm:flex-none"
										>
											Decline
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<div class="mb-6">
		<AddFriend />
	</div>

	<div>
		<FriendsList onChallengeClick={handleChallengeClick} />
	</div>
</div>

<Dialog bind:open={showChallengeModal}>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle class="text-xl md:text-2xl">⚔️ Create Battle Challenge</DialogTitle>
			<DialogDescription>
				Configure your battle challenge settings
			</DialogDescription>
		</DialogHeader>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<Label for="difficulty">Difficulty</Label>
				<select 
					id="difficulty" 
					bind:value={battleDifficulty}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
				</select>
			</div>

			<div class="space-y-2">
				<Label for="items">Number of Items ({battleItems})</Label>
				<Input
					id="items"
					type="number"
					bind:value={battleItems}
					min="3"
					max="20"
					step="1"
				/>
			</div>
		</div>
		<DialogFooter class="flex-col sm:flex-row gap-2">
			<Button 
				variant="outline" 
				onclick={() => (showChallengeModal = false)}
				class="w-full sm:w-auto"
			>
				Cancel
			</Button>
			<Button 
				onclick={createBattle} 
				disabled={creatingBattle}
				class="w-full sm:w-auto"
			>
				{creatingBattle ? 'Creating...' : 'Create Battle'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<style>
/* ================================
   TREASURE HUNT THEME — FRIENDS PAGE
   ================================ */

:root {
  --parchment-light: #c6a873;
  --parchment-mid: #5e4328;
  --parchment-dark: #02431aff;

  --leather-dark: #5a3a1c;
  --leather: #7a5230;
  --leather-light: #9d6c3b;

  --gold: #ffd678;
  --gold-soft: #ffe9b8;
  --gold-glow: rgba(255, 215, 140, 0.5);

  --ink-dark: #2a1a0e;
  --ink-muted: rgba(60, 35, 20, 0.65);

  --shadow-deep: rgba(0, 0, 0, 0.45);
}

/* -------------------------------
   PAGE BACKGROUND (MAP-LIKE)
--------------------------------*/
.container {
  background: linear-gradient(
    180deg,
    var(--parchment-dark) 0%,
    var(--parchment-mid) 40%,
    var(--parchment-light) 100%
  );
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 8px 35px var(--shadow-deep);
  backdrop-filter: blur(8px);
}

/* PAGE TITLE */
h1 {
  color: var(--gold);
  text-shadow: 0 0 6px var(--gold-glow);
  font-family: 'Fredoka One', sans-serif;
}

/* -------------------------------
   CARDS (Treasure parchment slabs)
--------------------------------*/
.card,
[data-shadcn-card] {
  background: rgba(150, 110, 70, 0.35) !important;
  border: 2px solid rgba(255, 225, 180, 0.25) !important;
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 22px var(--shadow-deep);
  border-radius: 1rem !important;
}

/* Card headings */
.card h3,
[data-shadcn-card] h3 {
  font-family: 'Fredoka One', sans-serif;
  color: var(--gold);
  text-shadow: 0 0 5px rgba(255, 200, 120, 0.3);
}

/* Card descriptions */
.card p,
[data-shadcn-card] p {
  color: var(--ink-muted);
}

/* -------------------------------
   BADGES (gold coins)
--------------------------------*/
.badge,
[data-shadcn-badge] {
  background: var(--leather-light) !important;
  border: 1px solid var(--gold) !important;
  color: var(--gold-soft) !important;
  font-family: 'Fredoka One', sans-serif;
}

/* -------------------------------
   BUTTONS (Leather buttons)
--------------------------------*/
button,
[data-shadcn-button] {
  background: linear-gradient(
    145deg,
    var(--leather) 0%,
    var(--leather-dark) 100%
  ) !important;
  border: 2px solid rgba(255, 225, 160, 0.35) !important;
  color: var(--gold-soft) !important;

  font-family: 'Fredoka One', sans-serif;
  border-radius: 0.7rem !important;

  transition: all 0.25s ease;
  text-shadow: 0 0 3px rgba(255, 240, 200, 0.25);
}

button:hover,
[data-shadcn-button]:hover {
  background: linear-gradient(
    145deg,
    var(--leather-light) 0%,
    var(--leather) 100%
  ) !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(140, 105, 60, 0.45);
}

/* Secondary / outline */
button[data-variant="outline"],
[data-shadcn-button][data-variant="outline"] {
  background: rgba(255, 240, 200, 0.08) !important;
  color: var(--leather-dark) !important;
  border: 2px solid var(--leather-light) !important;
}

/* Destructive (decline) */
button[data-variant="destructive"],
[data-shadcn-button][data-variant="destructive"] {
  background: #7b2a2a !important;
  border-color: #b85c5c !important;
}

button[data-variant="destructive"]:hover {
  background: #923636 !important;
}

/* -------------------------------
   INPUTS / SELECTS (map scribbles)
--------------------------------*/
input,
select,
[data-shadcn-input] {
  background: rgba(255, 240, 210, 0.1) !important;
  border: 2px solid rgba(120, 85, 55, 0.4) !important;
  color: var(--ink-dark) !important;

  border-radius: 0.6rem !important;
  font-family: 'Fredoka One', sans-serif;
}

input:focus,
select:focus {
  outline: none !important;
  border-color: var(--gold) !important;
  box-shadow: 0 0 6px var(--gold-glow) !important;
}

/* -------------------------------
   LABELS (map ink)
--------------------------------*/
label,
[data-shadcn-label] {
  color: var(--leather-dark) !important;
  font-weight: 600;
  font-family: 'Fredoka One', sans-serif;
}

/* -------------------------------
   MODAL (Treasure chest pop-up)
--------------------------------*/
.dialog-content,
[data-shadcn-dialog-content] {
  background: var(--parchment-light) !important;
  border: 2px solid var(--parchment-dark) !important;
  border-radius: 1rem !important;
  box-shadow: 0 10px 35px var(--shadow-deep);
}

/* Modal title */
.dialog-title {
  color: var(--gold) !important;
  font-family: 'Fredoka One', sans-serif;
}

/* Modal description */
.dialog-description {
  color: var(--ink-muted) !important;
}
</style>