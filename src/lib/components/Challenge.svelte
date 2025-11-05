<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type Challenge, type ChallengeItem } from '$lib/api/api';
	import { authStore } from '$lib/stores/auth';

	let currentChallenge: Challenge | null = null;
	let currentItemIndex = 0;
	let loading = false;
	let error = '';
	let showStartForm = true;

	// Form state
	let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
	let totalItems = 10;

	// Track image uploads and verification state for current item
	let imageFile: File | null = null;
	let imagePreview: string = '';
	let verifying = false;
	let message: { type: 'success' | 'error'; text: string } | null = null;

	const STORAGE_KEY = 'treasurehunt_challenge';

	// Load challenge from localStorage on mount
	onMount(() => {
		loadChallengeFromStorage();
	});

	function saveChallengeToStorage() {
		if (currentChallenge) {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					challenge: currentChallenge,
					currentItemIndex,
					showStartForm: false
				})
			);
		}
	}

	function loadChallengeFromStorage() {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const data = JSON.parse(stored);
				currentChallenge = data.challenge;
				currentItemIndex = data.currentItemIndex || 0;
				showStartForm = data.showStartForm !== false ? false : false;
			} catch (e) {
				console.error('Failed to load challenge from storage:', e);
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	}

	function clearChallengeStorage() {
		localStorage.removeItem(STORAGE_KEY);
	}

	async function startChallenge() {
		if (!$authStore.token) return;

		loading = true;
		error = '';

		try {
			currentChallenge = await api.challenges.start($authStore.token, {
				difficulty,
				totalItems
			});
			showStartForm = false;
			currentItemIndex = 0;
			clearImage();
			saveChallengeToStorage();
		} catch (err: any) {
			error = err.message || 'Failed to start challenge';
		} finally {
			loading = false;
		}
	}

	async function verifyCurrentItem() {
		if (!currentChallenge || !imageFile || !$authStore.token) return;

		const currentItem = currentChallenge.items[currentItemIndex];
		if (!currentItem || currentItem.found) return;

		verifying = true;
		message = null;

		try {
			// Convert image to base64
			const reader = new FileReader();
			reader.onload = async (e) => {
				const base64 = e.target?.result as string;

				try {
					const result = await api.challenges.verifyItem(
						$authStore.token!,
						currentChallenge!.id,
						currentItem.itemId,
						{ imageBase64: base64 }
					);

					if (result.found) {
						message = { type: 'success', text: result.message };
						if (result.challenge) {
							currentChallenge = result.challenge;
							saveChallengeToStorage();
						}
						// Clear image and move to next item after success
						setTimeout(() => {
							clearImage();
							moveToNextUnfoundItem();
							message = null;
						}, 2000);
					} else {
						message = { type: 'error', text: result.message };
					}
				} catch (err: any) {
					message = { type: 'error', text: err.message || 'Failed to verify item' };
				} finally {
					verifying = false;
				}
			};
			reader.readAsDataURL(imageFile);
		} catch (err: any) {
			message = { type: 'error', text: 'Failed to process image' };
			verifying = false;
		}
	}

	function moveToNextUnfoundItem() {
		if (!currentChallenge) return;

		for (let i = currentItemIndex + 1; i < currentChallenge.items.length; i++) {
			if (!currentChallenge.items[i].found) {
				currentItemIndex = i;
				saveChallengeToStorage();
				return;
			}
		}
		// If no unfound items after current, check from beginning
		for (let i = 0; i < currentItemIndex; i++) {
			if (!currentChallenge.items[i].found) {
				currentItemIndex = i;
				saveChallengeToStorage();
				return;
			}
		}
	}

	function moveToPreviousItem() {
		if (!currentChallenge || currentItemIndex <= 0) return;
		currentItemIndex--;
		clearImage();
		message = null;
		saveChallengeToStorage();
	}

	function moveToNextItem() {
		if (!currentChallenge || currentItemIndex >= currentChallenge.items.length - 1) return;
		currentItemIndex++;
		clearImage();
		message = null;
		saveChallengeToStorage();
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			handleFile(input.files[0]);
		}
	}

	function handleFile(file: File) {
		if (!file.type.startsWith('image/')) {
			message = { type: 'error', text: 'Please upload an image file' };
			return;
		}

		imageFile = file;
		const reader = new FileReader();
		reader.onload = (e) => {
			imagePreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
		message = null;
	}

	function clearImage() {
		imageFile = null;
		imagePreview = '';
		message = null;
	}

	function resetChallenge() {
		currentChallenge = null;
		showStartForm = true;
		currentItemIndex = 0;
		clearImage();
		error = '';
		clearChallengeStorage();
	}

	$: progress = currentChallenge
		? (currentChallenge.completedItems / currentChallenge.totalItems) * 100
		: 0;
	$: currentItem = currentChallenge?.items[currentItemIndex];
	$: canGoPrevious = currentItemIndex > 0;
	$: canGoNext = currentChallenge && currentItemIndex < currentChallenge.items.length - 1;


</script>

<div class="challenge-container">
	{#if showStartForm}
		<div class="start-form">
			<h2>Start a New Challenge</h2>
			<p>Find items in the real world using your camera!</p>

			<div class="form-group">
				<label for="difficulty">Difficulty:</label>
				<select id="difficulty" bind:value={difficulty}>
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
				</select>
			</div>

			<div class="form-group">
				<label for="totalItems">Number of Items (1-50):</label>
				<input
					id="totalItems"
					type="number"
					bind:value={totalItems}
					min="1"
					max="50"
					placeholder="10"
				/>
			</div>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<button on:click={startChallenge} disabled={loading} class="primary-button">
				{loading ? 'Starting...' : 'Start Challenge'}
			</button>
		</div>
	{:else if currentChallenge}
		<div class="active-challenge">
			<div class="challenge-header">
				<h2>Treasure Hunt Challenge</h2>
				<button on:click={resetChallenge} class="secondary-button">New Challenge</button>
			</div>

			<div class="challenge-info">
				<div class="info-item">
					<span class="label">Difficulty:</span>
					<span class="value difficulty-{currentChallenge.difficulty}"
						>{currentChallenge.difficulty.toUpperCase()}</span
					>
				</div>
				<div class="info-item">
					<span class="label">Progress:</span>
					<span class="value"
						>{currentChallenge.completedItems} / {currentChallenge.totalItems}</span
					>
				</div>
			</div>

			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>

			{#if currentChallenge.isCompleted}
				<div class="completion-message">
					<h3>🎉 Challenge Completed! 🎉</h3>
					<p>You found all {currentChallenge.totalItems} items!</p>
					<button on:click={resetChallenge} class="primary-button">Start New Challenge</button>
				</div>
			{:else if currentItem}
				<div class="current-item-display">
					<!-- Navigation header -->
					<div class="navigation-header">
						<button
							on:click={moveToPreviousItem}
							disabled={!canGoPrevious}
							class="nav-button"
							aria-label="Previous item"
						>
							← Previous
						</button>
						<div class="item-counter">
							Item {currentItemIndex + 1} of {currentChallenge.totalItems}
						</div>
						<button
							on:click={moveToNextItem}
							disabled={!canGoNext}
							class="nav-button"
							aria-label="Next item"
						>
							Next →
						</button>
					</div>

					<!-- Current item card -->
					<div class="current-item-card" class:found={currentItem.found}>
						<div class="item-status-bar">
							<span class="item-number">#{currentItem.itemId}</span>
							{#if currentItem.found}
								<span class="status-badge found-badge">✓ Found</span>
							{:else}
								<span class="status-badge pending-badge">🎯 To Find</span>
							{/if}
						</div>

						<div class="item-name-large">{currentItem.name}</div>

						{#if currentItem.found}
							<div class="found-message">
								<p>✅ Already found!</p>
								<p class="found-time">
									Found at: {new Date(currentItem.foundAt || '').toLocaleTimeString()}
								</p>
							</div>
						{:else}
							<p class="item-instruction">Find and photograph this item to mark it as complete</p>

							<!-- Image upload section -->
							<div class="upload-section">
								{#if imagePreview}
									<div class="image-preview-large">
										<img src={imagePreview} alt="Preview" />
										<button on:click={clearImage} class="clear-button" type="button">
											✕
										</button>
									</div>
								{:else}
									<div class="upload-zone">
										<input
											type="file"
											accept="image/*"
											on:change={handleFileInput}
											style="display: none;"
											id="file-input-current"
										/>
										<label for="file-input-current" class="upload-label">
											<span class="upload-icon">📸</span>
											<span>Choose Image</span>
										</label>
									</div>
								{/if}

								{#if message}
									<div class="message {message.type}">
										{message.text}
									</div>
								{/if}

								{#if imageFile && !currentItem.found}
									<button
										on:click={verifyCurrentItem}
										disabled={verifying}
										class="verify-button"
									>
										{verifying ? 'Verifying with AI...' : 'Verify Item'}
									</button>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Progress overview -->
					<div class="items-overview">
						<h4>All Items Overview:</h4>
						<div class="items-grid-mini">
							{#each currentChallenge.items as item, idx}
								<button
									class="mini-item"
									class:found={item.found}
									class:current={idx === currentItemIndex}
									on:click={() => {
										currentItemIndex = idx;
										clearImage();
										saveChallengeToStorage();
									}}
									title="{item.name} - {item.found ? 'Found' : 'Not found'}"
								>
									{#if item.found}
										✓
									{:else}
										{idx + 1}
									{/if}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.challenge-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.start-form {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.start-form h2 {
		margin-bottom: 0.5rem;
		color: #333;
	}

	.start-form p {
		color: #666;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}

	.form-group select,
	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group select:focus,
	.form-group input:focus {
		outline: none;
		border-color: #4caf50;
	}

	.active-challenge {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.challenge-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.challenge-header h2 {
		margin: 0;
		color: #333;
	}

	.challenge-info {
		display: flex;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-item .label {
		font-size: 0.875rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.info-item .value {
		font-size: 1.25rem;
		font-weight: 700;
		color: #333;
	}

	.difficulty-easy {
		color: #4caf50;
	}

	.difficulty-medium {
		color: #ff9800;
	}

	.difficulty-hard {
		color: #f44336;
	}

	.progress-bar {
		height: 12px;
		background: #e0e0e0;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 2rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #4caf50, #8bc34a);
		transition: width 0.3s ease;
	}

	.current-item-display {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.navigation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 12px;
	}

	.nav-button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 120px;
	}

	.nav-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.nav-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.item-counter {
		font-size: 1.125rem;
		font-weight: 600;
		color: #333;
	}

	.current-item-card {
		background: white;
		border: 3px solid #667eea;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
	}

	.current-item-card.found {
		border-color: #4caf50;
		background: rgba(76, 175, 80, 0.02);
	}

	.item-status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.item-name-large {
		font-size: 3rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 3px;
		text-align: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 1rem 0;
	}

	.item-instruction {
		text-align: center;
		color: #666;
		font-size: 1.125rem;
		margin-bottom: 2rem;
	}

	.upload-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.upload-zone {
		border: 3px dashed #ccc;
		border-radius: 12px;
		padding: 3rem 2rem;
		text-align: center;
		transition: all 0.2s;
		background: #fafafa;
	}

	.upload-zone:hover {
		border-color: #667eea;
		background: rgba(102, 126, 234, 0.02);
	}

	.upload-label {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 12px;
		cursor: pointer;
		font-size: 1.125rem;
		font-weight: 600;
		transition: all 0.2s;
	}

	.upload-label:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
	}

	.upload-icon {
		font-size: 3rem;
	}

	.image-preview-large {
		position: relative;
		width: 100%;
		max-height: 400px;
		overflow: hidden;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.image-preview-large img {
		width: 100%;
		height: 400px;
		object-fit: cover;
		border-radius: 12px;
	}

	.clear-button {
		position: absolute;
		top: 10px;
		right: 10px;
		background: #f44336;
		color: white;
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		transition: all 0.2s;
	}

	.clear-button:hover {
		transform: scale(1.1);
	}

	.verify-button {
		width: 100%;
		padding: 1.25rem;
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 1.25rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.verify-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
	}

	.verify-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.message {
		padding: 1rem 1.5rem;
		border-radius: 12px;
		font-size: 1.125rem;
		text-align: center;
		font-weight: 600;
	}

	.message.success {
		background: #e8f5e9;
		color: #2e7d32;
		border: 2px solid #4caf50;
	}

	.message.error {
		background: #ffebee;
		color: #c62828;
		border: 2px solid #f44336;
	}

	.found-message {
		text-align: center;
		padding: 2rem;
		background: rgba(76, 175, 80, 0.1);
		border-radius: 12px;
		margin-top: 1rem;
	}

	.found-message p:first-child {
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
	}

	.found-time {
		color: #2e7d32;
		font-size: 1rem;
		font-weight: 500;
		margin: 0;
	}

	.items-overview {
		background: #f5f5f5;
		padding: 1.5rem;
		border-radius: 12px;
	}

	.items-overview h4 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.125rem;
	}

	.items-grid-mini {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
		gap: 0.5rem;
	}

	.mini-item {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 700;
		transition: all 0.2s;
		font-size: 1rem;
	}

	.mini-item.current {
		border-color: #667eea;
		background: rgba(102, 126, 234, 0.1);
		transform: scale(1.1);
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	}

	.mini-item.found {
		background: #4caf50;
		border-color: #4caf50;
		color: white;
	}

	.mini-item:hover:not(.current) {
		border-color: #667eea;
		transform: scale(1.05);
	}

	.status-badge {
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.found-badge {
		background: #4caf50;
		color: white;
	}

	.pending-badge {
		background: #ff9800;
		color: white;
	}

	.item-number {
		font-weight: 700;
		color: #666;
		font-size: 1rem;
		background: #f5f5f5;
		padding: 0.5rem 1rem;
		border-radius: 8px;
	}

	.completion-message {
		text-align: center;
		padding: 3rem 2rem;
	}

	.completion-message h3 {
		font-size: 2rem;
		margin-bottom: 1rem;
		color: #4caf50;
	}

	.error {
		background: #ffebee;
		color: #c62828;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		text-align: center;
	}

	.primary-button {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.primary-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.primary-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.secondary-button {
		padding: 0.5rem 1rem;
		background: white;
		color: #667eea;
		border: 2px solid #667eea;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

  .secondary-button:hover {
    background: #667eea;
    color: white;
  }

  /* RESPONSIVE DESIGN */
  @media (max-width: 768px) {
    .challenge-container {
      padding: 1rem;
    }

    .start-form,
    .active-challenge {
      padding: 1.5rem;
    }

    .start-form h2 {
      font-size: 1.75rem;
    }

    .challenge-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .challenge-header h2 {
      font-size: 1.5rem;
    }

    .challenge-info {
      flex-direction: column;
      gap: 0.75rem;
    }

    .navigation-header {
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .nav-button {
      width: 100%;
      min-width: auto;
      font-size: 1rem;
      padding: 0.75rem;
    }

    .item-counter {
      font-size: 1rem;
      text-align: center;
    }

    .current-item-card {
      padding: 1.5rem;
    }

    .item-name-large {
      font-size: 2rem;
      letter-spacing: 1px;
    }

    .item-instruction {
      font-size: 1rem;
    }

    .upload-zone {
      padding: 2rem 1rem;
    }

    .upload-label {
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }

    .upload-icon {
      font-size: 2.5rem;
    }

    .image-preview-large img {
      height: 300px;
    }

    .verify-button {
      font-size: 1.125rem;
      padding: 1rem;
    }

    .items-grid-mini {
      grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
      gap: 0.4rem;
    }

    .mini-item {
      font-size: 0.875rem;
    }

    .completion-message {
      padding: 2rem 1rem;
    }

    .completion-message h3 {
      font-size: 1.75rem;
    }
  }

  @media (max-width: 480px) {
    .challenge-container {
      padding: 0.5rem;
    }

    .start-form,
    .active-challenge {
      padding: 1rem;
      border-radius: 8px;
    }

    .start-form h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .start-form p {
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      font-size: 0.875rem;
    }

    .form-group select,
    .form-group input {
      padding: 0.6rem;
      font-size: 0.9rem;
    }

    .challenge-header h2 {
      font-size: 1.25rem;
    }

    .secondary-button {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }

    .info-item .label {
      font-size: 0.75rem;
    }

    .info-item .value {
      font-size: 1rem;
    }

    .progress-bar {
      height: 10px;
      margin-bottom: 1.5rem;
    }

    .current-item-card {
      padding: 1rem;
    }

    .item-name-large {
      font-size: 1.5rem;
      letter-spacing: 0.5px;
      margin: 0.75rem 0;
    }

    .item-instruction {
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .status-badge {
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
    }

    .item-number {
      font-size: 0.875rem;
      padding: 0.4rem 0.75rem;
    }

    .upload-zone {
      padding: 1.5rem 1rem;
    }

    .upload-label {
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      gap: 0.75rem;
    }

    .upload-icon {
      font-size: 2rem;
    }

    .image-preview-large {
      max-height: 250px;
    }

    .image-preview-large img {
      height: 250px;
    }

    .clear-button {
      width: 35px;
      height: 35px;
      font-size: 1.25rem;
    }

    .verify-button {
      font-size: 1rem;
      padding: 1rem;
    }

    .message {
      padding: 0.875rem 1.25rem;
      font-size: 1rem;
    }

    .found-message p:first-child {
      font-size: 1.5rem;
    }

    .found-time {
      font-size: 0.875rem;
    }

    .items-overview {
      padding: 1rem;
    }

    .items-overview h4 {
      font-size: 1rem;
      margin-bottom: 0.75rem;
    }

    .items-grid-mini {
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 0.35rem;
    }

    .mini-item {
      font-size: 0.8rem;
    }

    .completion-message {
      padding: 1.5rem 1rem;
    }

    .completion-message h3 {
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
    }

    .completion-message p {
      font-size: 0.9rem;
    }

    .primary-button {
      font-size: 1rem;
      padding: 0.875rem;
    }

    .error {
      font-size: 0.875rem;
      padding: 0.875rem;
    }
  }

  /* Extra small devices */
  @media (max-width: 360px) {
    .item-name-large {
      font-size: 1.25rem;
    }

    .items-grid-mini {
      grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
    }

    .navigation-header {
      padding: 0.5rem;
    }

    .nav-button {
      padding: 0.6rem;
      font-size: 0.9rem;
    }
  }

  /* Landscape orientation optimization */
  @media (max-height: 600px) and (orientation: landscape) {
    .challenge-container {
      padding: 0.5rem;
    }

    .start-form,
    .active-challenge {
      padding: 1rem;
    }

    .item-name-large {
      font-size: 1.5rem;
      margin: 0.5rem 0;
    }

    .image-preview-large {
      max-height: 200px;
    }

    .image-preview-large img {
      height: 200px;
    }

    .upload-zone {
      padding: 1rem;
      min-height: 150px;
    }

    .completion-message {
      padding: 1rem;
    }

    .items-overview {
      padding: 0.75rem;
    }
  }
</style>