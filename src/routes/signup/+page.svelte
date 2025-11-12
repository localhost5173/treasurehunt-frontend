<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/auth';
  import { api, APIError } from '$lib/api/api';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let name = '';
  let confirmPassword = '';
  let error = '';
  let loading = false;

  // Redirect if already authenticated
  onMount(async () => {
    if (browser) {
      const isAuth = await authStore.checkAuth();
      if (isAuth) {
        goto('/');
      }
    }
  });

  async function handleSignup() {
    error = '';

    // Validation
    if (!email || !password || !name || !confirmPassword) {
      error = 'All fields are required';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (password.length < 6) {
      error = 'Password must be at least 6 characters';
      return;
    }

    loading = true;

    try {
      const response = await api.auth.signup({ email, password, name });
      authStore.login(response.token, response.user);
      goto('/');
    } catch (e) {
      if (e instanceof APIError) {
        error = e.message;
      } else {
        error = 'An unexpected error occurred';
      }
    } finally {
      loading = false;
    }
  }

  function goToLogin() {
    goto('/login');
  }
</script>

<div class="page-container">
  <div class="auth-container">
    <h1 class="auth-title">Sign Up</h1>

    <form on:submit|preventDefault={handleSignup} class="auth-form">
      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <div class="form-group">
        <label for="name">Name</label>
        <input
          type="text"
          id="name"
          bind:value={name}
          required
          placeholder="Your name"
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          placeholder="your@email.com"
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          placeholder="At least 6 characters"
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          bind:value={confirmPassword}
          required
          placeholder="Re-enter password"
          disabled={loading}
        />
      </div>

      <button type="submit" class="btn-submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>

    <p class="switch-auth">
      Already have an account?
      <button type="button" class="link-btn" on:click={goToLogin}>
        Login
      </button>
    </p>
  </div>
</div>

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
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Fredoka One', sans-serif;
    background-image: url('/Background.jpg');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    padding: 20px;
  }

  .auth-container {
    background: rgba(40, 25, 5, 0.95);
    border-radius: 25px;
    padding: 40px 60px;
    max-width: 450px;
    width: 100%;
    color: #ffcc33;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  }

  .auth-title {
    font-size: 42px;
    margin-bottom: 30px;
    text-align: center;
    color: #ffcc33;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .error-message {
    background: rgba(255, 50, 50, 0.8);
    color: white;
    padding: 12px;
    border-radius: 10px;
    text-align: center;
    font-size: 14px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-size: 18px;
    color: #ffb300;
  }

  .form-group input {
    padding: 12px 16px;
    border-radius: 15px;
    border: 2px solid #ff9900;
    background: rgba(60, 35, 10, 0.7);
    color: #ffcc33;
    font-size: 16px;
    font-family: 'Fredoka One', sans-serif;
    transition: all 0.3s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #ffcc33;
    background: rgba(60, 35, 10, 0.9);
  }

  .form-group input::placeholder {
    color: rgba(255, 204, 51, 0.5);
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-submit {
    padding: 15px 0;
    font-size: 20px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    background: linear-gradient(#ffcc33, #ff9900);
    box-shadow: 0px 5px 0px #cc7a00;
    transition: all 0.2s ease;
    color: #000;
    font-family: 'Fredoka One', sans-serif;
    margin-top: 10px;
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-3px);
  }

  .btn-submit:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0px 0px 0px #cc7a00;
  }

  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .switch-auth {
    margin-top: 20px;
    text-align: center;
    font-size: 16px;
    color: #ffb300;
  }

  .link-btn {
    background: none;
    border: none;
    color: #ffcc33;
    text-decoration: underline;
    cursor: pointer;
    font-family: 'Fredoka One', sans-serif;
    font-size: 16px;
    padding: 0;
    margin-left: 5px;
  }

  .link-btn:hover {
    color: #ff9900;
  }

  /* RESPONSIVE DESIGN */
  @media (max-width: 768px) {
    .page-container {
      padding: 15px;
    }

    .auth-container {
      padding: 30px 25px;
      max-width: 100%;
    }

    .auth-title {
      font-size: 36px;
      margin-bottom: 25px;
    }

    .form-group label {
      font-size: 16px;
    }

    .form-group input {
      padding: 10px 14px;
      font-size: 15px;
    }

    .btn-submit {
      font-size: 18px;
      padding: 12px 0;
    }

    .switch-auth {
      font-size: 15px;
    }

    .link-btn {
      font-size: 15px;
    }
  }

  @media (max-width: 480px) {
    .page-container {
      padding: 10px;
    }

    .auth-container {
      padding: 25px 20px;
      border-radius: 20px;
    }

    .auth-title {
      font-size: 32px;
      margin-bottom: 20px;
    }

    .auth-form {
      gap: 15px;
    }

    .form-group label {
      font-size: 15px;
    }

    .form-group input {
      padding: 10px 12px;
      font-size: 14px;
    }

    .btn-submit {
      font-size: 16px;
      padding: 12px 0;
    }

    .switch-auth {
      font-size: 14px;
      margin-top: 15px;
    }

    .link-btn {
      font-size: 14px;
    }

    .error-message {
      font-size: 13px;
      padding: 10px;
    }
  }

  @media (max-height: 650px) and (orientation: landscape) {
    .page-container {
      padding: 10px;
    }

    .auth-container {
      padding: 15px 25px;
    }

    .auth-title {
      font-size: 26px;
      margin-bottom: 12px;
    }

    .auth-form {
      gap: 10px;
    }

    .form-group input {
      padding: 8px 12px;
    }

    .btn-submit {
      padding: 10px 0;
      font-size: 16px;
      margin-top: 5px;
    }

    .switch-auth {
      margin-top: 12px;
      font-size: 14px;
    }
  }
</style>
