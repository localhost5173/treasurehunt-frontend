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
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Switch } from '$lib/components/ui/switch';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { Badge } from '$lib/components/ui/badge';

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

  function goToFriends() {
    goto('/friends');
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
    <div class="header-section">
      <h1 class="title">Epic Adventure</h1>
      <Badge variant="secondary" class="version-badge">Treasure Hunt Edition</Badge>
    </div>
    
    <Card class="main-menu-card">
      <CardHeader>
        <CardTitle class="menu-title">Main Menu</CardTitle>
        <CardDescription>Choose your adventure</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="menu-grid">
          <Button size="lg" class="menu-button" onclick={goToChallenge}>
            <span class="button-icon">🎮</span>
            Play Challenge
          </Button>
          <Button size="lg" variant="secondary" class="menu-button" onclick={goToChallengeLog}>
            <span class="button-icon">📜</span>
            Challenge Log
          </Button>
          <Button size="lg" variant="secondary" class="menu-button" onclick={goToFriends}>
            <span class="button-icon">👥</span>
            Friends & Battles
          </Button>
          <Button size="lg" variant="secondary" class="menu-button" onclick={goToImageAnalyzer}>
            <span class="button-icon">📷</span>
            Image Analyzer
          </Button>
          
          <Separator class="my-4" />
          
          <Button size="lg" variant="outline" class="menu-button" onclick={openSettings}>
            <span class="button-icon">⚙️</span>
            Settings
          </Button>
          <Button size="lg" variant="outline" class="menu-button" onclick={handleLogout}>
            <span class="button-icon">🚪</span>
            Logout
          </Button>
          <Button size="lg" variant="destructive" class="menu-button" onclick={quitGame}>
            <span class="button-icon">❌</span>
            Quit Game
          </Button>
        </div>
      </CardContent>
    </Card>
  {:else if currentPage === "settings"}
    <Card class="settings-card">
      <CardHeader>
        <CardTitle class="settings-title">⚙️ Settings</CardTitle>
        <CardDescription>Customize your experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="settings-content">
          <div class="setting-item">
            <div class="setting-info">
              <Label for="sound-toggle" class="setting-label">
                <span class="setting-icon">{soundOn ? '🔊' : '🔇'}</span>
                Sound Effects
              </Label>
              <p class="setting-description">Toggle game sound effects</p>
            </div>
            <Switch 
              id="sound-toggle" 
              checked={soundOn} 
              onCheckedChange={() => toggle('sound')}
            />
          </div>
          
          <Separator />
          
          <div class="setting-item">
            <div class="setting-info">
              <Label for="music-toggle" class="setting-label">
                <span class="setting-icon">{musicOn ? '🎵' : '🔕'}</span>
                Background Music
              </Label>
              <p class="setting-description">Toggle background music</p>
            </div>
            <Switch 
              id="music-toggle" 
              checked={musicOn} 
              onCheckedChange={() => toggle('music')}
            />
          </div>
        </div>
        
        <div class="settings-footer">
          <Button variant="outline" class="w-full" onclick={backToMenu}>
            ← Back to Menu
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>


<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');

  .container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    min-height: calc(100vh - 80px);
  }

  .header-section {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .title {
    font-size: clamp(2.5rem, 8vw, 4.5rem);
    color: #ffcc33;
    text-shadow: 
      3px 3px 0px #000,
      4px 4px 0px rgba(0,0,0,0.5),
      0 0 20px rgba(255, 204, 51, 0.5);
    margin: 0;
    animation: titleGlow 2s ease-in-out infinite;
  }

  @keyframes titleGlow {
    0%, 100% { text-shadow: 3px 3px 0px #000, 4px 4px 0px rgba(0,0,0,0.5), 0 0 20px rgba(255, 204, 51, 0.5); }
    50% { text-shadow: 3px 3px 0px #000, 4px 4px 0px rgba(0,0,0,0.5), 0 0 30px rgba(255, 204, 51, 0.8); }
  }

  :global(.version-badge) {
    font-family: 'Fredoka One', sans-serif;
    font-size: 0.875rem;
  }

  :global(.main-menu-card),
  :global(.settings-card) {
    width: 100%;
    background: rgba(20, 20, 30, 0.95);
    border: 2px solid rgba(255, 204, 51, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
  }

  :global(.menu-title),
  :global(.settings-title) {
    font-family: 'Fredoka One', sans-serif;
    color: #ffcc33;
    font-size: 1.875rem;
  }

  .menu-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  :global(.menu-button) {
    width: 100%;
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.125rem;
    height: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.2s ease;
  }

  :global(.menu-button:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 204, 51, 0.4);
  }

  :global(.menu-button:active) {
    transform: translateY(0);
  }

  .button-icon {
    font-size: 1.5rem;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .setting-info {
    flex: 1;
  }

  :global(.setting-label) {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.125rem;
    color: #ffcc33;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .setting-icon {
    font-size: 1.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .setting-description {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0.25rem 0 0 0;
  }

  .settings-footer {
    margin-top: 1rem;
  }

  :global(.w-full) {
    width: 100%;
  }

  :global(.my-4) {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .container {
      padding: 1rem;
    }

    :global(.menu-button) {
      font-size: 1rem;
      height: 3rem;
    }

    .button-icon {
      font-size: 1.25rem;
    }

    :global(.menu-title),
    :global(.settings-title) {
      font-size: 1.5rem;
    }
  }

  @media (max-height: 700px) {
    .container {
      gap: 1rem;
    }

    .title {
      font-size: clamp(2rem, 8vw, 3.5rem);
    }
  }
</style>
