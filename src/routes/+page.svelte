<audio
  src="/epic-adventure-background-music-404457.mp3"
  preload="auto"
  loop
  bind:this={myAudio}>
  <track kind="captions" />
</audio>

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/auth';

  // ====== State variables ======
  let currentPage = "menu";
  let soundOn = true;
  let musicOn = true;
  let myAudio: HTMLAudioElement | null = null;

  // ====== Authentication ======
  $: isAuthenticated = $authStore.isAuthenticated;

  onMount(async () => {
    const isAuth = await authStore.checkAuth();
    if (!isAuth) goto('/login');
  });

  // ====== Audio logic ======
  function playAudio() {
    if (myAudio && musicOn) {
      myAudio.play().catch((err) => {
        console.log("Autoplay blocked:", err);
      });
    }
  }

  function pauseAudio() {
    if (myAudio) myAudio.pause();
  }

  // Wait for first user interaction to bypass autoplay block
  onMount(() => {
    if (myAudio) {
      myAudio.loop = true;
      myAudio.volume = 0.3;
    }

    const handleUserInteraction = () => {
      if (musicOn) playAudio();
      window.removeEventListener('click', handleUserInteraction);
    };
    window.addEventListener('click', handleUserInteraction);
  });

  // ====== Settings logic ======
  function toggle(setting: string) {
    if (setting === "sound") {
      soundOn = !soundOn;
    } else if (setting === "music") {
      musicOn = !musicOn;
      if (musicOn) playAudio();
      else pauseAudio();
    }
  }

  // ====== Page navigation ======
  function openSettings() {
    currentPage = "settings";
  }

  function backToMenu() {
    currentPage = "menu";
  }

  function quitGame() {
    window.close();
  }

  function goToChallenge() {
    goto('/challenge');
  }

  function goToImageAnalyzer() {
    goto('/image-analyzer');
  }

  function goToChallengeLog() {
    goto('/challenge-log');
  }

  function handleLogout() {
    authStore.logout();
    goto('/login');
  }

  // ====== Reactive checks ======
  $: if (myAudio) {
    if (musicOn) playAudio();
    else pauseAudio();
  }

  $: if (browser && !isAuthenticated) {
    goto('/login');
  }
</script>
<div class="container">
  {#if currentPage === "menu"}
    <h1 class="title">Epic Adventure</h1>
    <div class="menu">
      <button class="btn" on:click={goToChallenge}>Play Challenge</button>
      <button class="btn" on:click={goToChallengeLog}>Challenge Log</button>
      <button class="btn" on:click={goToImageAnalyzer}>Image Analyzer</button>
      <button class="btn" on:click={openSettings}>Settings</button>
      <button class="btn" on:click={handleLogout}>Logout</button>
      <button class="btn" on:click={quitGame}>Quit Game</button>
    </div>
  {:else if currentPage === "settings"}
    <div class="settings-container">
      <h2 class="settings-title">Settings</h2>
      <div class="settings-option">
        <div class="icon-text">
          <span class="icon {soundOn ? 'active' : ''}">🔊</span>
          Sound
        </div>
        <button class="toggle-btn {soundOn ? 'on' : ''}" on:click={() => toggle('sound')}>
          {soundOn ? 'On' : 'Off'}
        </button>
      </div>
      <div class="settings-option">
        <div class="icon-text">
          <span class="icon {musicOn ? 'active' : ''}">🎵</span>
          Music
        </div>
        <button class="toggle-btn {musicOn ? 'on' : ''}" on:click={() => toggle('music')}>
          {musicOn ? 'On' : 'Off'}
        </button>
      </div>
      <button class="btn back-btn" on:click={backToMenu}>Back to Menu</button>
    </div>
  {/if}
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Fredoka One', sans-serif;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: url('Background.jpg');
    background-size: cover;
    background-position: center;
    color: #fff;
  }

  .container {
    text-align: center;
  }

  .title {
    font-size: 70px;
    color: #ffcc33;
    text-shadow: 3px 3px 5px #000;
    margin-bottom: 20px;
  }

  .menu {
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }

  .btn {
    width: 200px;
    padding: 15px 0;
    font-size: 24px;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    background: linear-gradient(#ffcc33, #ff9900);
    box-shadow: 0px 5px 0px #cc7a00;
    transition: all 0.2s ease;
    color: #000;
    font-family: 'Fredoka One', sans-serif;
  }

  .btn:hover {
    transform: translateY(-3px);
  }

  .btn:active {
    transform: translateY(3px);
    box-shadow: 0px 0px 0px #cc7a00;
  }

  .settings-container {
    background: rgba(40, 25, 5, 0.9);
    border-radius: 25px;
    padding: 40px 60px;
    text-align: center;
    color: #ffcc33;
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  }

  .settings-title {
    font-size: 50px;
    margin-bottom: 30px;
  }

  .settings-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(60, 35, 10, 0.9);
    padding: 15px 25px;
    border-radius: 20px;
    margin-bottom: 20px;
  }

  .icon-text {
    display: flex;
    align-items: center;
    font-size: 22px;
    color: #ffb300;
  }

  .icon {
    margin-right: 10px;
    font-size: 26px;
  }

  .icon.active {
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }

  .toggle-btn {
    background: linear-gradient(#cc7a00, #994d00);
    border: 2px solid #ffb300;
    color: #ffcc33;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 4px 0 #663300;
    transition: all 0.2s ease;
    font-family: 'Fredoka One', sans-serif;
  }

  .toggle-btn:hover {
    transform: translateY(-2px);
  }

  .toggle-btn:active {
    transform: translateY(2px);
    box-shadow: 0 0 0 #663300;
  }

  .toggle-btn.on {
    background: linear-gradient(#ffcc33, #ff9900);
    color: #000;
    box-shadow: 0 0 10px #ff9900;
  }

  .back-btn {
    margin-top: 20px;
    width: 100px;
    padding: 10px 0;
    font-size: 18px;
  }

  @media (max-width: 768px) {
    .container {
      padding: 20px;
      width: 100%;
      box-sizing: border-box;
    }
    .title {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .menu {
      gap: 12px;
      width: 100%;
    }
    .btn {
      width: 100%;
      max-width: 280px;
      font-size: 20px;
      padding: 12px 0;
    }
    .settings-container {
      padding: 25px 20px;
      margin: 20px;
      width: calc(100% - 40px);
      box-sizing: border-box;
    }
    .settings-title {
      font-size: 36px;
    }
    .settings-option {
      padding: 12px 15px;
    }
    .icon-text {
      font-size: 18px;
    }
    .toggle-btn {
      font-size: 16px;
      padding: 6px 12px;
    }
  }

  @media (max-width: 480px) {
    .title {
      font-size: 38px;
    }
    .btn {
      font-size: 18px;
      padding: 10px 0;
    }
    .settings-container {
      padding: 20px 15px;
      margin: 15px;
      width: calc(100% - 30px);
    }
    .settings-title {
      font-size: 30px;
    }
    .icon-text {
      font-size: 16px;
    }
    .toggle-btn {
      font-size: 14px;
      padding: 5px 10px;
    }
  }

  @media (max-height: 600px) and (orientation: landscape) {
    .title {
      font-size: 32px;
    }
    .btn {
      font-size: 16px;
      padding: 8px 0;
    }
    .settings-container {
      padding: 15px;
    }
  }
</style>
