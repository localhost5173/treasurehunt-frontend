<audio
  src="epic-adventure-background-music-404457.mp3"
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

  let currentPage = "menu";
  let soundOn = true;
  let musicOn = true;
  let language = "English";

  $: isAuthenticated = $authStore.isAuthenticated;

  onMount(async () => {
    const isAuth = await authStore.checkAuth();
    if (!isAuth) {
      goto('/login');
    }
  });

  let myAudio: HTMLAudioElement | null = null;

  onMount(() => {
    myAudio = new Audio("epic-adventure-background-music-404457.mp3");
    myAudio.loop = true;
    myAudio.volume = 0.3;
    if (musicOn) {
      playAudio();
    }
  });

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

  function toggle(setting: string) {
    if (setting === "sound") {
      soundOn = !soundOn;
    } else if (setting === "music") {
      musicOn = !musicOn;
      if (musicOn) {
        playAudio();
      } else {
        pauseAudio();
      }
    }
  }

  function changeLanguage() {
    const langs = ["English", "Spanish", "French", "German"];
    const currentIndex = langs.indexOf(language);
    language = langs[(currentIndex + 1) % langs.length];
  }

  function openSettings() {
    currentPage = "settings";
  }

  function backToMenu() {
    currentPage = "menu";
  }

  function quitGame() {
    window.close();
  }

  $: if (myAudio) {
    if (musicOn) playAudio();
    else pauseAudio();
  }

  // Client-side only navigation guard
  $: if (browser && !isAuthenticated) {
    goto('/login');
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
</script>

{#if currentPage === "menu"}
  <div class="container">
    <h1 class="title">Treasure<br />Hunt</h1>
    <div class="menu">
      <button class="btn" on:click={goToChallenge}>Play Challenge</button>
      <button class="btn" on:click={goToChallengeLog}>Challenge Log</button>
      <button class="btn" on:click={goToImageAnalyzer}>Image Analyzer</button>
      <button class="btn" on:click={openSettings}>Settings</button>
      <button class="btn" on:click={handleLogout}>Logout</button>
      <button class="btn" on:click={quitGame}>Quit</button>
    </div>
  </div>
{:else if currentPage === "settings"}
  <div class="settings-container">
    <h1 class="settings-title">Settings</h1>
    <div class="settings-option">
      <div class="icon-text">
        <span class="icon" class:active={soundOn}>
          {#if soundOn}🔊{:else}🔇{/if}
        </span>
        <span>Sound</span>
      </div>
      <button class="toggle-btn" class:on={soundOn} on:click={() => toggle("sound")}>
        {soundOn ? "ON" : "OFF"}
      </button>
    </div>
    <div class="settings-option">
      <div class="icon-text">
        <span class="icon" class:active={musicOn}>
          {#if musicOn}🎵{:else}🔕{/if}
        </span>
        <span>Music</span>
      </div>
      <button class="toggle-btn" class:on={musicOn} on:click={() => toggle("music")}>
        {musicOn ? "ON" : "OFF"}
      </button>
    </div>
    <div class="settings-option">
      <div class="icon-text">
        <span class="icon">🌐</span>
        <span>Language</span>
      </div>
      <button class="lang-btn" on:click={changeLanguage}>{language}</button>
    </div>
    <button class="btn back-btn" on:click={backToMenu}>Back</button>
  </div>
{/if}

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

  .lang-btn {
    background: linear-gradient(#ffcc33, #ff9900);
    border: none;
    border-radius: 20px;
    padding: 8px 12px;
    width: 100px;
    font-size: 18px;
    color: #000;
    cursor: pointer;
    box-shadow: 0px 4px 0px #cc7a00;
    transition: transform 0.2s ease;
    font-family: 'Fredoka One', sans-serif;
  }

  .lang-btn:hover {
    transform: translateY(-2px);
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
    .lang-btn {
      font-size: 16px;
      width: 90px;
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
    .lang-btn {
      font-size: 14px;
      width: 80px;
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
