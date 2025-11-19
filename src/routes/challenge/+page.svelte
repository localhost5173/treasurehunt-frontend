<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import Challenge from '$lib/components/Challenge.svelte';
  import { api } from '$lib/api/api';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';

  let isAuthenticated = false;
  let challengeComponent: Challenge;
  let hasLoadedBattleChallenge = false;
  let isBattleChallenge = false;
  
  // Get battleId from URL params
  $: battleId = $page.url.searchParams.get('battleId');
  $: itemId = $page.url.searchParams.get('itemId');

  onMount(async () => {
    if (browser) {
      // Scroll to top when page loads
      window.scrollTo(0, 0);
      
      isAuthenticated = await authStore.checkAuth();
      if (!isAuthenticated) {
        goto('/login');
        return;
      }

      // Check if current challenge is a battle challenge
      checkIfBattleChallenge();

      // If we have a battleId, load the battle challenge once
      if (battleId && $authStore.token && !hasLoadedBattleChallenge) {
        hasLoadedBattleChallenge = true;
        await loadBattleChallenge();
      }
    }
  });

  function checkIfBattleChallenge() {
    const userId = $authStore.user?.id;
    const storageKey = userId ? `treasurehunt_challenge_${userId}` : 'treasurehunt_challenge';
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        isBattleChallenge = !!data.battleId;
      } catch (e) {
        console.error('Failed to parse stored challenge:', e);
      }
    }
  }

  async function loadBattleChallenge() {
    if (!battleId || !$authStore.token) return;

    try {
      // Get the battle to find the user's challenge
      const battle = await api.battles.getBattle($authStore.token, battleId);
      const myParticipant = battle.participants.find((p) => p.userId === $authStore.user?.id);
      
      if (!myParticipant) {
        console.error('User is not a participant in this battle');
        return;
      }

      // Check if challenge exists
      const hasValidChallengeId = myParticipant.challengeId && 
        myParticipant.challengeId !== '000000000000000000000000';

      let challenge;
      if (hasValidChallengeId && myParticipant.challengeId) {
        challenge = await api.challenges.getById($authStore.token, myParticipant.challengeId);
      } else {
        // Join the battle to create the challenge
        challenge = await api.battles.joinBattle($authStore.token, battleId);
      }

      if (challenge) {
        // Find the item index if itemId is provided
        let currentItemIndex = 0;
        if (itemId) {
          const index = challenge.items.findIndex((item) => item.itemId === parseInt(itemId));
          if (index !== -1) {
            currentItemIndex = index;
          }
        } else {
          // Find first unfound item
          for (let i = 0; i < challenge.items.length; i++) {
            if (!challenge.items[i].found) {
              currentItemIndex = i;
              break;
            }
          }
        }

        // Save to localStorage with battle context
        const userId = $authStore.user?.id;
        const storageKey = userId ? `treasurehunt_challenge_${userId}` : 'treasurehunt_challenge';
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            challenge,
            currentItemIndex,
            showStartForm: false,
            battleId // Include battleId to track this is a battle challenge
          })
        );

        // Clear the URL parameters to prevent reload loop
        const url = new URL(window.location.href);
        url.searchParams.delete('battleId');
        url.searchParams.delete('itemId');
        window.history.replaceState({}, '', url.toString());

        // Trigger the Challenge component to reload from localStorage
        if (challengeComponent) {
          // The component should auto-load from localStorage
          window.location.reload();
        }
      }
    } catch (err: any) {
      console.error('Failed to load battle challenge:', err);
      alert(err.message || 'Failed to load battle challenge');
    }
  }

  function goBack() {
    // Check if we have a battleId in localStorage
    const userId = $authStore.user?.id;
    const storageKey = userId ? `treasurehunt_challenge_${userId}` : 'treasurehunt_challenge';
    const stored = localStorage.getItem(storageKey);
    
    let storedBattleId = null;
    if (stored) {
      try {
        const data = JSON.parse(stored);
        storedBattleId = data.battleId;
      } catch (e) {
        console.error('Failed to parse stored challenge:', e);
      }
    }
    
    // If we have a battleId (from URL or storage), go back to the battle page
    if (battleId || storedBattleId) {
      goto(`/battle/${battleId || storedBattleId}`);
    } else {
      goto('/');
    }
  }

  function goToChallengeLog() {
    goto('/challenge-log');
  }
</script>

{#if isAuthenticated}
  <div class="page-container">
    <Card class="challenge-card">
      <CardContent class="challenge-content">
        <Challenge bind:this={challengeComponent} onQuit={goBack} />
        <div class="bottom-buttons">
          <Button size="lg" variant="secondary" onclick={goToChallengeLog}>
            📜 Challenge Log
          </Button>
          <Button size="lg" variant="outline" onclick={goBack}>
            {isBattleChallenge ? '← Back to Battle' : '← Back to Menu'}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}

<style>
  :global(body) {
    height: auto !important;
    min-height: 100vh;
    display: block !important;
    overflow-y: auto !important;
  }

  .page-container {
    min-height: 100vh;
    max-height: 100vh;
    padding: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: stretch;
    overflow: hidden;
  }

  :global(.challenge-card) {
    width: 100%;
    max-width: 1200px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  :global(.challenge-content) {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .bottom-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    padding-top: 0.5rem;
    border-top: 1px solid hsl(var(--border));
    flex-shrink: 0;
  }

  /* RESPONSIVE DESIGN */
  @media (max-width: 768px) {
    .page-container {
      padding: 1rem;
    }

    :global(.challenge-content) {
      padding: 1.5rem;
    }

    .bottom-buttons {
      flex-direction: column;
      align-items: stretch;
    }

    .bottom-buttons :global(button) {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .page-container {
      padding: 0.5rem;
    }

    :global(.challenge-content) {
      padding: 1rem;
    }
  }

  @media (max-height: 600px) and (orientation: landscape) {
    .page-container {
      padding: 0.5rem;
    }

    :global(.challenge-content) {
      padding: 1rem;
      gap: 1rem;
    }

    .bottom-buttons {
      padding-top: 0.5rem;
    }
  }
</style>
