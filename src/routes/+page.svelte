<audio
  src="epic-adventure-background-music-404457.mp3"
  preload="auto"
  loop
  bind:this={myAudio}>
  <track kind="captions" />
</audio>

<script lang="ts">
  import { onMount } from "svelte";

  // PAGE STATE
  let currentPage = "menu"; // "menu" | "gameSetup" | "settings"

  // SETTINGS STATE
  let soundOn = true;
  let musicOn = true;
  let language = "English";

  // GAME SETUP STATE
  let objectCount = null;
  let difficulty = null;

  // AUDIO
  let myAudio: HTMLAudioElement | null = null;

  // Initialize audio on mount
  onMount(() => {
    myAudio = new Audio("epic-adventure-background-music-404457.mp3");
    myAudio.loop = true;
    myAudio.volume = 0.3;

    // Try to start automatically
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

  // TOGGLE FUNCTIONS
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

  // LANGUAGE CYCLE
  function changeLanguage() {
    const langs = ["English", "Spanish", "French", "German"];
    const currentIndex = langs.indexOf(language);
    language = langs[(currentIndex + 1) % langs.length];
  }

  // NAVIGATION
  function goToGame() {
    currentPage = "gameSetup";
  }

  function openSettings() {
    currentPage = "settings";
  }

  function backToMenu() {
    currentPage = "menu";
  }

  // GAME ACTIONS
  function startGame() {
    window.location.href = "gamemenu.html";
  }

  function quitGame() {
    window.close();
  }

  // REACTIVE: sync playback with music toggle
  $: if (myAudio) {
    if (musicOn) playAudio();
    else pauseAudio();
  }
</script>

<!-- MENU PAGE -->
{#if currentPage === "menu"}
  <div class="container">
    <h1 class="title">Treasure<br />Hunt</h1>

    <div class="menu">
      <button class="btn" on:click={goToGame}>Play</button>
      <button class="btn" on:click={openSettings}>Settings</button>
      <button class="btn" on:click={quitGame}>Quit</button>
    </div>
  </div>

<!-- SETTINGS PAGE -->
{:else if currentPage === "settings"}
  <div class="settings-container">
    <h1 class="settings-title">Settings</h1>

    <!-- Sound toggle -->
    <div class="settings-option">
      <div class="icon-text">
        <span class="icon" class:active={soundOn}>
          {#if soundOn}🔊{:else}🔇{/if}
        </span>
        <span>Sound</span>
      </div>
      <button
        class="toggle-btn"
        class:on={soundOn}
        on:click={() => toggle("sound")}
      >
        {soundOn ? "ON" : "OFF"}
      </button>
    </div>

    <!-- Music toggle -->
    <div class="settings-option">
      <div class="icon-text">
        <span class="icon" class:active={musicOn}>
          {#if musicOn}🎵{:else}🔕{/if}
        </span>
        <span>Music</span>
      </div>
      <button
        class="toggle-btn"
        class:on={musicOn}
        on:click={() => toggle("music")}
      >
        {musicOn ? "ON" : "OFF"}
      </button>
    </div>

    <!-- Language selector -->
    <div class="settings-option">
      <div class="icon-text">
        <span class="icon">🌐</span>
        <span>Language</span>
      </div>
      <button class="lang-btn" on:click={changeLanguage}>{language}</button>
    </div>

    <button class="btn back-btn" on:click={backToMenu}>Back</button>
  </div>

<!-- GAME SETUP PAGE -->
{:else if currentPage === "gameSetup"}
  <div class="settings-container">
    <h1 class="settings-title">Game Settings</h1>

    <!-- Number of Objects -->
    <div class="section">
      <h2>Number of Objects</h2>
      <div class="button-group">
        <button class="btn small" on:click={() => (objectCount = 5)}>5</button>
        <button class="btn small" on:click={() => (objectCount = 8)}>8</button>
        <button class="btn small" on:click={() => (objectCount = 10)}>10</button>
      </div>
    </div>

    <!-- Difficulty -->
    <div class="section">
      <h2>Difficulty</h2>
      <div class="button-group">
        <button class="btn small" on:click={() => (difficulty = "Easy")}>Easy</button>
        <button class="btn small" on:click={() => (difficulty = "Medium")}>Medium</button>
        <button class="btn small" on:click={() => (difficulty = "Hard")}>Hard</button>
      </div>
    </div>

    <button class="btn start-btn" on:click={startGame}>
      Start Treasure Hunt
    </button>
    <div>
      <button class="btn small back-btn" on:click={backToMenu}>Back</button>
    </div>
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
  }

  .btn.small {
    width: 80px;
    padding: 10px 0;
    font-size: 18px;
  }

  .start-btn {
    width: 250px;
    margin-top: 20px;
  }

  .btn:hover {
    transform: translateY(-3px);
  }

  .btn:active {
    transform: translateY(3px);
    box-shadow: 0px 0px 0px #cc7a00;
  }

  /* SETTINGS PAGE STYLE */
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
    transform-origin: center;
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }

  /* 🎵 NEW TOGGLE BUTTON STYLE */
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

  /* LANGUAGE BUTTON */
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
    text-align: center;
    letter-spacing: 0.5px;
    margin-left: 12px;
  }

  .lang-btn:hover {
    transform: translateY(-2px);
  }

  .back-btn {
    margin-top: 20px;
    width: 100px;
    padding: 10px 0;
    font-size: 18px;
    border-radius: 20px;
  }
</style>
