<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { api, APIError } from '$lib/api/api';

  let isDragging = false;
  let prompt = '';
  let imageFile: File | null = null;
  let imagePreview = '';
  let result: boolean | null = null;
  let loading = false;
  let error = '';

  $: token = $authStore.token;

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
</script>

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
</div>

<style>
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
</style>
