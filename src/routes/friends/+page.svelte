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
