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

  function handleLogout() {
    authStore.logout();
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

  function goToFriends() {
    goto('/friends');
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
  
    <Card class="main-menu-card">
      <CardContent class="pt-6">
        <div class="menu-grid">
          <!-- Primary CTA -->
          <Button size="lg" class="menu-button cta-button" onclick={goToChallenge}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
              <path d="M17.5 7.5a5 5 0 1 0-9 0L6 14"/>
              <path d="M18 14a5 5 0 1 0-11.9 0"/>
              <path d="M9.7 17.7a5 5 0 0 0 4.6 0"/>
            </svg>
            <span>Play Challenge</span>
          </Button>
          
          <!-- Secondary Actions -->
          <Button size="lg" variant="secondary" class="menu-button" onclick={goToChallengeLog}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" x2="8" y1="13" y2="13"/>
              <line x1="16" x2="8" y1="17" y2="17"/>
              <line x1="10" x2="8" y1="9" y2="9"/>
            </svg>
            <span>Challenge Log</span>
          </Button>
          <Button size="lg" variant="secondary" class="menu-button" onclick={goToFriends}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Friends & Battles</span>
          </Button>
          <Button size="lg" variant="secondary" class="menu-button" onclick={goToImageAnalyzer}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
            <span>Image Analyzer</span>
          </Button>
          
          <Separator class="my-4" />
          
          <Button size="lg" variant="outline" class="menu-button" onclick={openSettings}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Settings</span>
          </Button>
          <Button size="lg" variant="destructive" class="menu-button" onclick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
            <span>Logout</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  {:else if currentPage === "settings"}
    <Card class="settings-card">
      <CardHeader>
        <CardTitle class="settings-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Settings
        </CardTitle>
        <CardDescription>Customize your experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="settings-content">
          <div class="setting-item">
            <div class="setting-info">
              <Label for="sound-toggle" class="setting-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="setting-icon">
                  {#if soundOn}
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  {:else}
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="22" x2="16" y1="9" y2="15"/>
                    <line x1="16" x2="22" y1="9" y2="15"/>
                  {/if}
                </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="setting-icon">
                  {#if musicOn}
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  {:else}
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                    <line x1="2" x2="22" y1="2" y2="22"/>
                  {/if}
                </svg>
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
    min-height: 100vh;
  }

  @media (min-width: 640px) {
    .container-wrapper {
      padding: 2rem;
      gap: 2rem;
    }
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
    background: rgba(15, 23, 42, 0.98);
    border: 2px solid rgba(59, 130, 246, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
  }

  :global(.settings-title) {
    font-family: 'Fredoka One', sans-serif;
    color: rgb(96, 165, 250);
    font-size: 1.5rem;
    display: flex;
    align-items: center;
  }

  @media (min-width: 640px) {
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

  :global(.cta-button) {
    background: linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%);
    color: white;
    font-size: 1.25rem;
    height: 4rem;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
    border: 2px solid rgba(96, 165, 250, 0.5);
  }

  :global(.cta-button:hover) {
    background: linear-gradient(135deg, rgb(96, 165, 250) 0%, rgb(59, 130, 246) 100%);
    transform: translateY(-3px);
    box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);
  }

  @media (min-width: 640px) {
    :global(.menu-button) {
      font-size: 1.125rem;
      height: 3.5rem;
    }
    
    :global(.cta-button) {
      font-size: 1.375rem;
      height: 4.5rem;
    }
  }

  :global(.menu-button:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  :global(.menu-button:active) {
    transform: translateY(0);
  }

  .button-icon {
    flex-shrink: 0;
  }

  :global(.cta-button .button-icon) {
    width: 28px;
    height: 28px;
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
    color: rgb(96, 165, 250);
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
    flex-shrink: 0;
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
