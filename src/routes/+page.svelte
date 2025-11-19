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

<audio
  src="/epic-adventure-background-music-404457.mp3"
  preload="auto"
  loop
  bind:this={myAudio}>
  <track kind="captions" />
</audio>

<div class="container-wrapper">
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
            <span>Play Challenge</span>
          </Button>
          <Button size="lg" variant="secondary" class="menu-button" onclick={goToChallengeLog}>
            <span class="button-icon">📜</span>
            <span>Challenge Log</span>
          </Button>
          <Button size="lg" variant="secondary" class="menu-button" onclick={goToFriends}>
            <span class="button-icon">👥</span>
            <span>Friends & Battles</span>
          </Button>
          <Button size="lg" variant="secondary" class="menu-button" onclick={goToImageAnalyzer}>
            <span class="button-icon">📷</span>
            <span>Image Analyzer</span>
          </Button>
          
          <Separator class="my-4" />
          
          <Button size="lg" variant="outline" class="menu-button" onclick={openSettings}>
            <span class="button-icon">⚙️</span>
            <span>Settings</span>
          </Button>
          <Button size="lg" variant="destructive" class="menu-button" onclick={quitGame}>
            <span class="button-icon">❌</span>
            <span>Quit Game</span>
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
                <span>Sound Effects</span>
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
                <span>Background Music</span>
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

  .container-wrapper {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    min-height: calc(100vh - 4rem);
  }

  @media (min-width: 640px) {
    .container-wrapper {
      padding: 2rem;
      gap: 2rem;
    }
  }

  .header-section {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1rem;
  }

  .title {
    font-size: clamp(2rem, 10vw, 4.5rem);
    color: #ffcc33;
    text-shadow: 
      2px 2px 0px #000,
      3px 3px 0px rgba(0,0,0,0.5),
      0 0 20px rgba(255, 204, 51, 0.5);
    margin: 0;
    animation: titleGlow 2s ease-in-out infinite;
    line-height: 1.2;
  }

  @keyframes titleGlow {
    0%, 100% { text-shadow: 2px 2px 0px #000, 3px 3px 0px rgba(0,0,0,0.5), 0 0 20px rgba(255, 204, 51, 0.5); }
    50% { text-shadow: 2px 2px 0px #000, 3px 3px 0px rgba(0,0,0,0.5), 0 0 30px rgba(255, 204, 51, 0.8); }
  }

  :global(.version-badge) {
    font-family: 'Fredoka One', sans-serif;
    font-size: 0.75rem;
  }

  @media (min-width: 640px) {
    :global(.version-badge) {
      font-size: 0.875rem;
    }
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
    font-size: 1.5rem;
  }

  @media (min-width: 640px) {
    :global(.menu-title),
    :global(.settings-title) {
      font-size: 1.875rem;
    }
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
    font-size: 1rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.2s ease;
  }

  @media (min-width: 640px) {
    :global(.menu-button) {
      font-size: 1.125rem;
      height: 3.5rem;
    }
  }

  :global(.menu-button:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 204, 51, 0.4);
  }

  :global(.menu-button:active) {
    transform: translateY(0);
  }

  .button-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .button-icon {
      font-size: 1.5rem;
    }
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
    min-width: 0;
  }

  :global(.setting-label) {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1rem;
    color: #ffcc33;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  @media (min-width: 640px) {
    :global(.setting-label) {
      font-size: 1.125rem;
    }
  }

  .setting-icon {
    font-size: 1.25rem;
    animation: pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .setting-icon {
      font-size: 1.5rem;
    }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .setting-description {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0.25rem 0 0 0;
  }

  @media (min-width: 640px) {
    .setting-description {
      font-size: 0.875rem;
    }
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

  /* Touch improvements for mobile */
  @media (hover: none) and (pointer: coarse) {
    :global(.menu-button),
    :global(button) {
      min-height: 44px;
      min-width: 44px;
    }
  }
</style>
