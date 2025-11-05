<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import Challenge from '$lib/components/Challenge.svelte';

  let isAuthenticated = false;

  onMount(async () => {
    if (browser) {
      isAuthenticated = await authStore.checkAuth();
      if (!isAuthenticated) {
        goto('/login');
      }
    }
  });

  function goBack() {
    goto('/');
  }
</script>

{#if isAuthenticated}
  <div class="page-container">
    <div class="challenge-wrapper">
      <Challenge />
      <button class="btn-back" on:click={goBack}>Back to Menu</button>
    </div>
  </div>
{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');

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

  .btn-back {
    width: 200px;
    padding: 15px 0;
    font-size: 20px;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    background: linear-gradient(#999, #666);
    box-shadow: 0px 5px 0px #333;
    transition: all 0.2s ease;
    color: #fff;
    font-family: 'Fredoka One', sans-serif;
    align-self: center;
  }

  .btn-back:hover {
    transform: translateY(-3px);
  }

  .btn-back:active {
    transform: translateY(3px);
    box-shadow: 0px 0px 0px #333;
  }

  /* RESPONSIVE DESIGN */
  @media (max-width: 768px) {
    .page-container {
      padding: 15px;
    }

    .challenge-wrapper {
      gap: 15px;
    }

    .btn-back {
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

    .btn-back {
      font-size: 16px;
      padding: 10px 0;
    }
  }

  @media (max-height: 600px) and (orientation: landscape) {
    .page-container {
      padding: 10px;
      align-items: flex-start;
    }

    .btn-back {
      padding: 10px 0;
      font-size: 16px;
    }
  }
</style>
