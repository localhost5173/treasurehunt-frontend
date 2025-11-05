<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/auth';
  import { api, APIError } from '$lib/api/api';
  import { onMount } from 'svelte';

  let isAuthenticated = false;
  let isDragging = false;
  let prompt = '';
  let imageFile: File | null = null;
  let imagePreview = '';
  let result: boolean | null = null;
  let loading = false;
  let error = '';

  let token = '';

  onMount(async () => {
    if (browser) {
      isAuthenticated = await authStore.checkAuth();
      if (!isAuthenticated) {
        goto('/login');
      } else {
        authStore.subscribe(state => {
          token = state.token || '';
        });
      }
    }
  });

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      error = 'Please upload an image file';
      return;
    }

    imageFile = file;
    error = '';
    result = null;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function analyzeImage() {
    if (!imageFile || !prompt || !token) {
      error = 'Please provide both an image and a prompt';
      return;
    }

    loading = true;
    error = '';
    result = null;

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        try {
          const response = await api.image.analyze(token, {
            imageBase64: base64String,
            prompt: prompt
          });

          result = response.result;
        } catch (err) {
          if (err instanceof APIError) {
            error = err.message;
          } else {
            error = 'Failed to analyze image';
          }
        } finally {
          loading = false;
        }
      };

      reader.onerror = () => {
        error = 'Failed to read image file';
        loading = false;
      };

      reader.readAsDataURL(imageFile);
    } catch (err) {
      error = 'An unexpected error occurred';
      loading = false;
    }
  }

  function reset() {
    imageFile = null;
    imagePreview = '';
    prompt = '';
    result = null;
    error = '';
  }

  function goBack() {
    goto('/');
  }
</script>

{#if isAuthenticated}
  <div class="page-container">
    <div class="upload-container">
      <h2 class="upload-title">Treasure Hunt Image Analyzer</h2>

      <div
        class="dropzone"
        class:dragging={isDragging}
        on:dragenter={handleDragEnter}
        on:dragleave={handleDragLeave}
        on:dragover={handleDragOver}
        on:drop={handleDrop}
        role="button"
        tabindex="0"
      >
        {#if imagePreview}
          <img src={imagePreview} alt="Preview" class="image-preview" />
        {:else}
          <div class="dropzone-content">
            <div class="icon">📸</div>
            <p>Drag & drop an image here</p>
            <p class="or">or</p>
            <label for="file-input" class="file-label">
              Browse Files
            </label>
            <input
              type="file"
              id="file-input"
              accept="image/*"
              on:change={handleFileInput}
              style="display: none;"
            />
          </div>
        {/if}
      </div>

      {#if imagePreview}
        <div class="prompt-section">
          <label for="prompt">What are you looking for?</label>
          <input
            type="text"
            id="prompt"
            bind:value={prompt}
            placeholder="e.g., Is there a cat in the image?"
            disabled={loading}
          />
        </div>

        <div class="button-group">
          <button class="btn btn-analyze" on:click={analyzeImage} disabled={loading || !prompt}>
            {loading ? 'Analyzing...' : 'Analyze Image'}
          </button>
          <button class="btn btn-reset" on:click={reset} disabled={loading}>
            Reset
          </button>
        </div>
      {/if}

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      {#if result !== null}
        <div class="result-box" class:found={result} class:not-found={!result}>
          <div class="result-icon">{result ? '✅' : '❌'}</div>
          <div class="result-text">
            {result ? 'Yes! Found it!' : 'Not found'}
          </div>
          <div class="result-description">
            {result 
              ? 'The object you are looking for is present in the image!' 
              : 'The object you are looking for was not found in the image.'}
          </div>
        </div>
      {/if}

      <button class="btn-back" on:click={goBack}>Back to Menu</button>
    </div>
  </div>
{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');

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

  .upload-container {
    background: rgba(40, 25, 5, 0.95);
    border-radius: 25px;
    padding: 40px;
    max-width: 600px;
    width: 100%;
    color: #ffcc33;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  }

  .upload-title {
    font-size: 32px;
    margin-bottom: 30px;
    text-align: center;
    color: #ffcc33;
  }

  .dropzone {
    border: 3px dashed #ff9900;
    border-radius: 20px;
    padding: 40px;
    text-align: center;
    background: rgba(60, 35, 10, 0.5);
    transition: all 0.3s ease;
    cursor: pointer;
    min-height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dropzone.dragging {
    border-color: #ffcc33;
    background: rgba(255, 204, 51, 0.1);
  }

  .dropzone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .icon {
    font-size: 64px;
  }

  .dropzone-content p {
    font-size: 18px;
    color: #ffb300;
    margin: 0;
  }

  .or {
    font-size: 14px !important;
    color: rgba(255, 179, 0, 0.6) !important;
  }

  .file-label {
    padding: 12px 24px;
    background: linear-gradient(#ffcc33, #ff9900);
    border-radius: 20px;
    color: #000;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
    box-shadow: 0px 4px 0px #cc7a00;
  }

  .file-label:hover {
    transform: translateY(-2px);
  }

  .file-label:active {
    transform: translateY(2px);
    box-shadow: 0px 0px 0px #cc7a00;
  }

  .image-preview {
    max-width: 100%;
    max-height: 300px;
    border-radius: 15px;
    object-fit: contain;
  }

  .prompt-section {
    margin-top: 25px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .prompt-section label {
    font-size: 18px;
    color: #ffb300;
  }

  .prompt-section input {
    padding: 14px 18px;
    border-radius: 15px;
    border: 2px solid #ff9900;
    background: rgba(60, 35, 10, 0.7);
    color: #ffcc33;
    font-size: 16px;
    font-family: 'Fredoka One', sans-serif;
    transition: all 0.3s ease;
  }

  .prompt-section input:focus {
    outline: none;
    border-color: #ffcc33;
    background: rgba(60, 35, 10, 0.9);
  }

  .prompt-section input::placeholder {
    color: rgba(255, 204, 51, 0.5);
  }

  .button-group {
    display: flex;
    gap: 15px;
    margin-top: 20px;
  }

  .btn {
    flex: 1;
    padding: 15px 0;
    font-size: 18px;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-family: 'Fredoka One', sans-serif;
    transition: all 0.2s ease;
  }

  .btn-analyze {
    background: linear-gradient(#ffcc33, #ff9900);
    box-shadow: 0px 5px 0px #cc7a00;
    color: #000;
  }

  .btn-analyze:hover:not(:disabled) {
    transform: translateY(-3px);
  }

  .btn-analyze:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0px 0px 0px #cc7a00;
  }

  .btn-reset {
    background: linear-gradient(#999, #666);
    box-shadow: 0px 5px 0px #333;
    color: #fff;
  }

  .btn-reset:hover:not(:disabled) {
    transform: translateY(-3px);
  }

  .btn-reset:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0px 0px 0px #333;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    margin-top: 20px;
    background: rgba(255, 50, 50, 0.8);
    color: white;
    padding: 12px;
    border-radius: 10px;
    text-align: center;
    font-size: 14px;
  }

  .result-box {
    margin-top: 25px;
    padding: 25px;
    border-radius: 20px;
    text-align: center;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .result-box.found {
    background: rgba(50, 200, 50, 0.2);
    border: 2px solid #32c832;
  }

  .result-box.not-found {
    background: rgba(200, 50, 50, 0.2);
    border: 2px solid #c83232;
  }

  .result-icon {
    font-size: 48px;
    margin-bottom: 10px;
  }

  .result-text {
    font-size: 28px;
    margin-bottom: 10px;
    color: #ffcc33;
  }

  .result-description {
    font-size: 16px;
    color: #ffb300;
  }

  .btn-back {
    width: 100%;
    margin-top: 20px;
    padding: 15px 0;
    font-size: 18px;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    background: linear-gradient(#667eea, #764ba2);
    box-shadow: 0px 5px 0px #4a3580;
    transition: all 0.2s ease;
    color: #fff;
    font-family: 'Fredoka One', sans-serif;
  }

  .btn-back:hover {
    transform: translateY(-3px);
  }

  .btn-back:active {
    transform: translateY(3px);
    box-shadow: 0px 0px 0px #4a3580;
  }

  /* RESPONSIVE DESIGN */
  @media (max-width: 768px) {
    .page-container {
      padding: 15px;
    }

    .upload-container {
      padding: 30px 25px;
      max-width: 100%;
    }

    .upload-title {
      font-size: 28px;
      margin-bottom: 25px;
    }

    .dropzone {
      padding: 30px 20px;
      min-height: 220px;
    }

    .icon {
      font-size: 56px;
    }

    .dropzone-content p {
      font-size: 16px;
    }

    .file-label {
      padding: 10px 20px;
      font-size: 15px;
    }

    .image-preview {
      max-height: 250px;
    }

    .prompt-section {
      margin-top: 20px;
    }

    .prompt-section label {
      font-size: 16px;
    }

    .prompt-section input {
      padding: 12px 16px;
      font-size: 15px;
    }

    .button-group {
      flex-direction: column;
      gap: 12px;
    }

    .btn {
      font-size: 16px;
      padding: 12px 0;
    }

    .result-box {
      padding: 20px;
    }

    .result-icon {
      font-size: 42px;
    }

    .result-text {
      font-size: 24px;
    }

    .result-description {
      font-size: 15px;
    }

    .btn-back {
      font-size: 16px;
      padding: 12px 0;
    }
  }

  @media (max-width: 480px) {
    .page-container {
      padding: 10px;
    }

    .upload-container {
      padding: 25px 20px;
      border-radius: 20px;
    }

    .upload-title {
      font-size: 24px;
      margin-bottom: 20px;
    }

    .dropzone {
      padding: 25px 15px;
      min-height: 200px;
      border-width: 2px;
    }

    .icon {
      font-size: 48px;
    }

    .dropzone-content {
      gap: 12px;
    }

    .dropzone-content p {
      font-size: 15px;
    }

    .or {
      font-size: 13px !important;
    }

    .file-label {
      padding: 10px 18px;
      font-size: 14px;
    }

    .image-preview {
      max-height: 220px;
    }

    .prompt-section {
      margin-top: 18px;
      gap: 8px;
    }

    .prompt-section label {
      font-size: 15px;
    }

    .prompt-section input {
      padding: 11px 14px;
      font-size: 14px;
    }

    .button-group {
      margin-top: 15px;
      gap: 10px;
    }

    .btn {
      font-size: 15px;
      padding: 11px 0;
    }

    .result-box {
      padding: 18px;
      margin-top: 20px;
    }

    .result-icon {
      font-size: 38px;
      margin-bottom: 8px;
    }

    .result-text {
      font-size: 22px;
      margin-bottom: 8px;
    }

    .result-description {
      font-size: 14px;
    }

    .error-message {
      font-size: 13px;
      padding: 10px;
    }

    .btn-back {
      font-size: 15px;
      padding: 11px 0;
    }
  }

  @media (max-width: 360px) {
    .upload-container {
      padding: 20px 15px;
    }

    .upload-title {
      font-size: 22px;
      margin-bottom: 18px;
    }

    .dropzone {
      padding: 20px 12px;
      min-height: 180px;
    }

    .icon {
      font-size: 42px;
    }

    .dropzone-content p {
      font-size: 14px;
    }

    .file-label {
      padding: 8px 16px;
      font-size: 13px;
    }

    .prompt-section input {
      padding: 10px 12px;
      font-size: 13px;
    }

    .btn {
      font-size: 14px;
      padding: 10px 0;
    }

    .btn-back {
      font-size: 14px;
      padding: 10px 0;
    }
  }

  /* Landscape orientation */
  @media (max-height: 600px) and (orientation: landscape) {
    .page-container {
      padding: 10px;
    }

    .upload-container {
      padding: 20px;
    }

    .upload-title {
      font-size: 22px;
      margin-bottom: 15px;
    }

    .dropzone {
      padding: 20px;
      min-height: 150px;
    }

    .icon {
      font-size: 40px;
    }

    .image-preview {
      max-height: 180px;
    }

    .result-box {
      padding: 15px;
      margin-top: 15px;
    }

    .result-icon {
      font-size: 32px;
    }

    .result-text {
      font-size: 20px;
    }

    .btn-back {
      padding: 10px 0;
      font-size: 15px;
      margin-top: 15px;
    }
  }
</style>
