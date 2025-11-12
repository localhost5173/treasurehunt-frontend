<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import Challenge from '$lib/components/Challenge.svelte';
  import { api } from '$lib/api/api';

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
    <div class="challenge-wrapper">
      <Challenge bind:this={challengeComponent} onQuit={goBack} />
      <div class="bottom-buttons">
        <button class="btn-log" on:click={goToChallengeLog}>Challenge Log</button>
        <button class="btn-back" on:click={goBack}>
          {isBattleChallenge ? 'Back to Battle' : 'Back to Menu'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');

  :global(body) {
    height: auto !important;
    min-height: 100vh;
    display: block !important;
    overflow-y: auto !important;
  }

  .page-container {
    min-height: 100vh;
    font-family: 'Fredoka One', sans-serif;
    background-image: url('/Background.jpg');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .challenge-wrapper {
    width: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .bottom-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-back,
  .btn-log {
    width: 200px;
    padding: 15px 0;
    font-size: 20px;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    box-shadow: 0px 5px 0px;
    transition: all 0.2s ease;
    color: #fff;
    font-family: 'Fredoka One', sans-serif;
  }

  .btn-back {
    background: linear-gradient(#999, #666);
    box-shadow: 0px 5px 0px #333;
  }

  .btn-log {
    background: linear-gradient(#667eea, #764ba2);
    box-shadow: 0px 5px 0px #4a2c75;
  }

  .btn-back:hover,
  .btn-log:hover {
    transform: translateY(-3px);
  }

  .btn-back:active,
  .btn-log:active {
    transform: translateY(3px);
    box-shadow: 0px 0px 0px;
  }

  /* RESPONSIVE DESIGN */
  @media (max-width: 768px) {
    .page-container {
      padding: 15px;
    }

    .challenge-wrapper {
      gap: 15px;
    }

    .bottom-buttons {
      flex-direction: column;
      align-items: center;
    }

    .btn-back,
    .btn-log {
      width: 100%;
      max-width: 280px;
      font-size: 18px;
      padding: 12px 0;
    }
  }

  @media (max-width: 480px) {
    .page-container {
      padding: 10px;
    }

    .challenge-wrapper {
      gap: 12px;
    }

    .btn-back,
    .btn-log {
      font-size: 16px;
      padding: 10px 0;
    }
  }

  @media (max-height: 600px) and (orientation: landscape) {
    .page-container {
      padding: 10px;
      align-items: flex-start;
    }

    .btn-back,
    .btn-log {
      padding: 10px 0;
      font-size: 16px;
    }
  }
</style>
