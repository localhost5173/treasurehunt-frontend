<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import Challenge from '$lib/components/Challenge.svelte';

  let isAuthenticated = false;

  onMount(async () => {
    if (browser) {
      // Scroll to top when page loads
      window.scrollTo(0, 0);
      
      isAuthenticated = await authStore.checkAuth();
      if (!isAuthenticated) {
        goto('/login');
      }
    }
  });

  function goBack() {
    goto('/');
  }

  function goToChallengeLog() {
    goto('/challenge-log');
  }
</script>

{#if isAuthenticated}
  <div class="page-container">
    <div class="challenge-wrapper">
      <Challenge onQuit={goBack} />
      <div class="bottom-buttons">
        <button class="btn-log" on:click={goToChallengeLog}>Challenge Log</button>
        <button class="btn-back" on:click={goBack}>Back to Menu</button>
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
