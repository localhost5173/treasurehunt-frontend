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
        <!-- Main challenge area with proper scrolling -->
        <div class="challenge-main">
          <Challenge bind:this={challengeComponent} onQuit={goBack} />
        </div>
        
        <!-- Fixed footer at bottom -->
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
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');

:root {
  /* --- COLOR PALETTE: Treasure Adventure --- */
  /* Background cave / night sky tones */
  --bg-dark: #02431aff;      /* deep leather brown */
  --bg-mid: #5e4328;       /* aged parchment shadows */
  --bg-light: #c6a873;


  /* Card: aged parchment glass */
  --card-bg: rgba(235, 215, 175, 0.14);
  --card-border: rgba(255, 215, 140, 0.22);

  /* Footer: subtle bronze tint */
  --glass-footer-bg: rgba(60, 50, 30, 0.35);

  /* Accents: treasure gold + parchment */
  --accent-mint: #f7d88a;        /* renamed but kept var */
  --accent-mint-soft: #f9efd6;   /* parchment soft */
  --accent-gold: #ffda6b;

  /* Text: map-ink neutrals */
  --text-primary: #f5f1e5;
  --text-soft: rgba(240, 230, 210, 0.85);

  /* Buttons: bronze / rusty adventure metal */
  --btn-bg: rgba(120, 85, 45, 0.85);
  --btn-bg-hover: rgba(145, 105, 60, 0.92);
  --btn-border: rgba(255, 215, 160, 0.35);

  --shadow-strong: rgba(0, 0, 0, 0.55);
}

/* BODY BACKGROUND */
:global(body) {
  height: auto !important;
  min-height: 100vh;
  display: block !important;
  overflow-y: auto !important;

  background: linear-gradient(
    180deg,
    var(--bg-dark) 0%,
    var(--bg-mid) 45%,
    var(--bg-light) 100%
  );
  background-attachment: fixed;
  margin: 0;
  padding: 0;
}

/* MAIN PAGE CONTAINER */
.page-container {
  min-height: 100vh;
  padding: 0.75rem;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: stretch;
}

/* CHALLENGE CARD */
:global(.challenge-card) {
  width: 100%;
  max-width: 1200px;
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 1.5rem); /* Account for padding */
  border-radius: 1rem;
  box-shadow: 0 8px 30px var(--shadow-strong);
  overflow: hidden; /* Prevent card overflow */
}

/* CONTENT AREA */
:global(.challenge-content) {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* Important for flex children scrolling */
  color: var(--text-primary);
  text-shadow: 0 0 4px rgba(80, 70, 50, 0.3);
  font-size: 1rem;
  line-height: 1.5;
}

/* Main challenge area - scrollable */
.challenge-main {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Important for scrolling */
}

/* BUTTON FOOTER */
.bottom-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(255, 215, 140, 0.25);
  background: var(--glass-footer-bg);
  flex-shrink: 0; /* Prevent footer from shrinking */
}

/* BUTTONS */
.bottom-buttons :global(button) {
  background: var(--btn-bg);
  border: 2px solid var(--btn-border);
  color: var(--text-primary) !important;
  border-radius: 0.65rem;
  padding: 0.55rem 1.2rem;
  text-shadow: 0 0 4px rgba(255, 220, 150, 0.25);
  transition: all 0.2s ease;
  font-family: 'Fredoka One', sans-serif;
}

.bottom-buttons :global(button:hover) {
  background: var(--btn-bg-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(255, 200, 120, 0.35);
}

.bottom-buttons :global(button:active) {
  transform: translateY(0);
}

/* Make sure Challenge component content is properly contained */
:global(.challenge-main > *) {
  width: 100%;
}

/* Ensure images in challenge don't overflow */
:global(.challenge-main img) {
  max-width: 100%;
  height: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-container {
    padding: 0.5rem;
  }

  :global(.challenge-card) {
    height: calc(100vh - 1rem);
    border-radius: 0.75rem;
  }

  .challenge-main {
    padding: 0.75rem;
  }

  .bottom-buttons {
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
  }

  .bottom-buttons :global(button) {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-container {
    padding: 0.25rem;
  }

  :global(.challenge-card) {
    height: calc(100vh - 0.5rem);
    border-radius: 0.5rem;
  }

  .challenge-main {
    padding: 0.5rem;
  }
}

/* Landscape mode for mobile */
@media (max-height: 600px) and (orientation: landscape) {
  .page-container {
    padding: 0.25rem;
  }

  :global(.challenge-card) {
    height: calc(100vh - 0.5rem);
  }

  .challenge-main {
    padding: 0.5rem;
  }

  .bottom-buttons {
    padding: 0.5rem;
  }
}

/* Ensure the Challenge component inside has proper sizing */
:global(.challenge-container) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:global(.challenge-scrollable) {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
</style>