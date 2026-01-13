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

          
          <Separator class="my-4" />

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
          Settings
        </CardTitle>
        <CardDescription>Customize your experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="settings-content">
          <!-- settings items... -->
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


  /* --- COLOR PALETTE: Treasure Map + Adventure --- */
  .container-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

  :root {
    --bg-dark: #02431aff;      /* deep leather brown */
    --bg-mid: #5e4328;       /* aged parchment shadows */
    --bg-light: #c6a873;     /* warm map parchment */

    --glass-bg: rgba(125, 95, 60, 0.55); /* antique-glass brown */
    --glass-border: rgba(255, 230, 170, 0.25); /* soft gold */

    --accent-gold: #ffd876;  /* treasure gold */
    --accent-gold-soft: #ffeebe;
    --accent-parchment: #f7e3b1;

    --btn-brown: #6d4b2f;        /* leather button */
    --btn-brown-hover: #8a623c;  /* lighter leather */
    --btn-brown-dark: #4f341c;   /* deep worn leather */

    --text-light: #fff6df;    /* parchment-white */
    --text-muted: rgba(255, 240, 210, 0.75);
  }

  /* MAIN BACKGROUND: treasure map gradient */
  .container-wrapper {
    width: 100%;
    max-width: 650px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
    min-height: 100vh;

    background: linear-gradient(
      180deg,
      var(--bg-dark) 0%,
      var(--bg-mid) 35%,
      var(--bg-light) 100%
    );
    background-attachment: fixed;
  }

  @media (min-width: 640px) {
    .container-wrapper {
      padding: 2rem;
      gap: 2rem;
    }
  }

  /* VERSION BADGE: gold tag */
  :global(.version-badge) {
    font-family: 'Fredoka One', sans-serif;
    font-size: 0.8rem;
    background: rgba(90, 65, 40, 0.75);
    color: var(--accent-gold);
    padding: 0.3rem 0.55rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 215, 160, 0.3);
  }

  /* PANELS / CARDS: parchment-glass */
  :global(.main-menu-card),
  :global(.settings-card) {
    width: 100%;
    background: var(--glass-bg);
    border: 2px solid var(--glass-border);

    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(14px);
    border-radius: 1rem;
  }

  /* TITLES: treasure gold */
  :global(.settings-title) {
    font-family: 'Fredoka One', sans-serif;
    color: var(--accent-gold);
    font-size: 1.6rem;
    display: flex;
    align-items: center;
    text-shadow: 0 0 8px rgba(255, 220, 140, 0.3);
    letter-spacing: 0.5px;
  }

  @media (min-width: 640px) {
    :global(.settings-title) {
      font-size: 1.9rem;
    }
  }

  /* MENU BUTTONS: leather with gold trim */
  :global(.menu-button) {
    width: 100%;
    height: 3.2rem;
    font-family: 'Fredoka One', sans-serif;
    font-size: 1.05rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    background: rgba(110, 80, 45, 0.75);
    color: var(--text-light);
    border: 2px solid rgba(255, 220, 150, 0.35);
    border-radius: 0.75rem;

    transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }

  :global(.menu-button:hover) {
    transform: translateY(-2px);
    background: rgba(140, 105, 60, 0.85);
    box-shadow: 0 4px 14px rgba(140, 105, 60, 0.45);
  }

  /* CTA BUTTON: treasure chest glow */
  :global(.cta-button) {
    background: linear-gradient(145deg, var(--btn-brown) 0%, var(--btn-brown-dark) 100%);
    color: var(--accent-gold-soft);

    font-size: 1.3rem;
    height: 4.4rem;
    border-radius: 0.9rem;

    border: 2px solid rgba(255, 225, 160, 0.45);
    box-shadow: 0 4px 24px rgba(110, 85, 50, 0.5);

    transition: all 0.25s ease;
  }

  :global(.cta-button:hover) {
    background: linear-gradient(145deg, var(--btn-brown-hover) 0%, var(--btn-brown) 100%);
    transform: translateY(-3px);
    box-shadow: 0 6px 28px rgba(190, 150, 80, 0.55);
  }

  /* SETTINGS LIST */
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

  /* Labels: gold highlight */
  :global(.setting-label) {
    font-family: 'Fredoka One', sans-serif;
    font-size: 1rem;
    color: var(--accent-gold);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;

    text-shadow: 0 0 4px rgba(255, 220, 150, 0.25);
  }

  @media (min-width: 640px) {
    :global(.setting-label) {
      font-size: 1.1rem;
    }
  }

  .setting-description {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  @media (min-width: 640px) {
    .setting-description {
      font-size: 0.9rem;
    }
  }

  /* FOOTER */
  .settings-footer {
    margin-top: 1rem;
  }

  /* Utilities */
  :global(.w-full) { width: 100%; }
  :global(.my-4) { margin: 1rem 0; }

  /* Mobile touch improvements */
  @media (hover: none) and (pointer: coarse) {
    :global(.menu-button),
    :global(button) {
      min-height: 44px;
      min-width: 44px;
    }
  }
</style>