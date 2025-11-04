<script>
  // PAGE STATE
  let currentPage = "menu"; // "menu" | "gameSetup" | "settings"

  // SETTINGS STATE
  let soundOn = true;
  let musicOn = true;
  let language = "English";

  // GAME SETUP STATE
  let objectCount = null;
  let difficulty = null;

  // Navigation
  function goToGame() {
    currentPage = "gameSetup";
  }

  function openSettings() {
    currentPage = "settings";
  }

  function backToMenu() {
    currentPage = "menu";
  }

  // Actions
  function toggleSound() {
    soundOn = !soundOn;
  }

  function toggleMusic() {
    musicOn = !musicOn;
  }

  function changeLanguage() {
    const langs = ["English", "Spanish", "French", "German"];
    const currentIndex = langs.indexOf(language);
    language = langs[(currentIndex + 1) % langs.length];
  }

  function startGame() {
    window.location.href = 'gamemenu.html';
  }

  function quitGame() {
    window.close();
  }
</script>

{#if currentPage === "menu"}
<div class="container">
    <h1 class="title">Treasure<br />Hunt</h1>

    <div class="menu">
      <button class="btn" on:click={goToGame}>Play</button>
      <button class="btn" on:click={openSettings}>Settings</button>
      <button class="btn" on:click={quitGame}>Quit</button>
    </div>
  </div>

{:else if currentPage === "settings"}
  <!-- SETTINGS PAGE -->
  <div class="settings-container">
    <h1 class="settings-title">Settings</h1>

    <div class="settings-option">
      <div class="icon-text">
        <span class="icon" class:active={soundOn}>{#if soundOn}🔊{:else}🔇{/if}</span>
        <span>Sound</span>
      </div>
      <label class="switch">
        <input type="checkbox" bind:checked={soundOn} on:change={toggleSound} aria-label={soundOn ? 'Sound on' : 'Sound off'} />
        <span class="slider"></span>
      </label>
    </div>

    <div class="settings-option">
      <div class="icon-text">
        <span class="icon" class:active={musicOn}>{#if musicOn}🎵{:else}🔕{/if}</span>
        <span>Music</span>
      </div>
      <label class="switch">
        <input type="checkbox" bind:checked={musicOn} on:change={toggleMusic} aria-label={musicOn ? 'Music on' : 'Music off'} />
        <span class="slider"></span>
      </label>
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

{:else if currentPage === "gameSetup"}
  <!-- GAME SETUP PAGE -->
  <div class="settings-container">
    <h1 class="settings-title">Game Settings</h1>
    <div class="section">
      <h2>Number of Objects</h2>
      <div class="button-group">
        <button class="btn small" on:click={() => (objectCount = 5)}>5</button>
        <button class="btn small" on:click={() => (objectCount = 8)}>8</button>
        <button class="btn small" on:click={() => (objectCount = 10)}>10</button>
      </div>
    </div>

    <div class="section">
      <h2>Difficulty</h2>
      <div class="button-group">
        <button class="btn small" on:click={() => (difficulty = 'Easy')}>Easy</button>
        <button class="btn small" on:click={() => (difficulty = 'Medium')}>Medium</button>
        <button class="btn small" on:click={() => (difficulty = 'Hard')}>Hard</button>
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

  /* active icon animation when enabled */
  .icon.active {
    transform-origin: center;
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }

  /* TOGGLE SWITCH */
  .switch {
    position: relative;
    display: inline-block;
    width: 55px;
    height: 30px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background-color: #cc7a00;
    transition: 0.4s;
    border-radius: 34px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 5px;
    bottom: 5px;
    background-color: #ffcc33;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #ff9900;
  }

  input:checked + .slider:before {
    transform: translateX(24px);
  }

  /* LANGUAGE BUTTON */
/* LANGUAGE BUTTON (fixed width, no size jump) */
.lang-btn {
  background: linear-gradient(#ffcc33, #ff9900);
  border: none;
  border-radius: 20px;
  padding: 8px 12px;      /* ✅ Added horizontal padding */
  width: 100px;
  font-size: 18px;
  color: #000;
  cursor: pointer;
  box-shadow: 0px 4px 0px #cc7a00;
  transition: transform 0.2s ease;
  text-align: center;
  letter-spacing: 0.5px;  /* ✅ Optional: slightly looser text spacing */
}

.lang-btn {
  margin-left: 12px; /* ensure the button sits slightly to the right */
}

.lang-btn:hover {
  transform: translateY(-2px);
}

.back-btn {
  margin-top: 20px;
  width: 100px;          /* ✅ Matches other small buttons */
  padding: 10px 0;
  font-size: 18px;
  border-radius: 20px;
}
</style>
