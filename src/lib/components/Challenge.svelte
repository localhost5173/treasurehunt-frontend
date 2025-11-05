<script lang="ts">
	import { api, type Challenge, type ChallengeItem } from '$lib/api/api';
	import { authStore } from '$lib/stores/auth';

	let currentChallenge: Challenge | null = null;
	let currentItemIndex = 0;
	let loading = false;
	let error = '';
	let success = '';
	let showStartForm = true;

	// Form state
	let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
	let totalItems = 10;

	// Image upload state
	let isDragging = false;
	let imagePreview = '';
	let imageFile: File | null = null;
	let verifying = false;

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
		} catch (err: any) {
			error = err.message || 'Failed to start challenge';
		} finally {
			loading = false;
		}
	}

	async function verifyCurrentItem() {
		if (!currentChallenge || !imageFile || !$authStore.token) return;

		const currentItem = getCurrentItem();
		if (!currentItem) return;

		verifying = true;
		error = '';
		success = '';

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
						success = result.message;
						if (result.challenge) {
							currentChallenge = result.challenge;
						}
						// Move to next unfound item
						setTimeout(() => {
							moveToNextUnfoundItem();
							clearImageUpload();
							success = '';
						}, 2000);
					} else {
						error = result.message;
					}
				} catch (err: any) {
					error = err.message || 'Failed to verify item';
				} finally {
					verifying = false;
				}
			};
			reader.readAsDataURL(imageFile);
		} catch (err: any) {
			error = err.message || 'Failed to process image';
			verifying = false;
		}
	}

	function getCurrentItem(): ChallengeItem | null {
		if (!currentChallenge) return null;
		return currentChallenge.items[currentItemIndex] || null;
	}

	function moveToNextUnfoundItem() {
		if (!currentChallenge) return;

		for (let i = 0; i < currentChallenge.items.length; i++) {
			if (!currentChallenge.items[i].found) {
				currentItemIndex = i;
				return;
			}
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
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
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			handleFile(input.files[0]);
		}
	}

	function handleFile(file: File) {
		if (!file.type.startsWith('image/')) {
			error = 'Please upload an image file';
			return;
		}

		imageFile = file;
		const reader = new FileReader();
		reader.onload = (e) => {
			imagePreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
		error = '';
	}

	function clearImageUpload() {
		imageFile = null;
		imagePreview = '';
	}

	function resetChallenge() {
		currentChallenge = null;
		showStartForm = true;
		currentItemIndex = 0;
		clearImageUpload();
		error = '';
		success = '';
	}

	$: currentItem = getCurrentItem();
	$: progress = currentChallenge
		? (currentChallenge.completedItems / currentChallenge.totalItems) * 100
		: 0;
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
				<div class="current-item">
					<h3>Find: <span class="item-name">{currentItem.name}</span></h3>
					<p>Take a photo of a {currentItem.name} to verify</p>
				</div>

				<div
					class="upload-area"
					class:dragging={isDragging}
					on:dragover={handleDragOver}
					on:dragleave={handleDragLeave}
					on:drop={handleDrop}
					role="button"
					tabindex="0"
				>
					{#if imagePreview}
						<div class="image-preview">
							<img src={imagePreview} alt="Preview" />
							<button on:click={clearImageUpload} class="clear-button">✕</button>
						</div>
					{:else}
						<div class="upload-prompt">
							<p>📸 Drop an image here or click to upload</p>
							<input
								type="file"
								accept="image/*"
								on:change={handleFileInput}
								style="display: none;"
								id="file-input"
							/>
							<label for="file-input" class="upload-label">Choose Image</label>
						</div>
					{/if}
				</div>

				{#if error}
					<div class="error">{error}</div>
				{/if}

				{#if success}
					<div class="success">{success}</div>
				{/if}

				<button
					on:click={verifyCurrentItem}
					disabled={!imageFile || verifying}
					class="primary-button verify-button"
				>
					{verifying ? 'Verifying...' : 'Verify Item'}
				</button>

				<div class="items-list">
					<h4>Items List:</h4>
					<div class="items-grid">
						{#each currentChallenge.items as item, idx}
							<div
								class="item-card"
								class:found={item.found}
								class:current={idx === currentItemIndex}
							>
								<span class="item-number">{idx + 1}</span>
								<span class="item-text">{item.name}</span>
								{#if item.found}
									<span class="checkmark">✓</span>
								{/if}
							</div>
						{/each}
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

	.current-item {
		text-align: center;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		color: white;
		margin-bottom: 2rem;
	}

	.current-item h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.item-name {
		font-size: 2rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 2px;
	}

	.upload-area {
		border: 3px dashed #ccc;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		transition: all 0.2s;
		margin-bottom: 1rem;
		min-height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.upload-area.dragging {
		border-color: #4caf50;
		background: rgba(76, 175, 80, 0.05);
	}

	.image-preview {
		position: relative;
		width: 100%;
		max-width: 400px;
	}

	.image-preview img {
		width: 100%;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.clear-button {
		position: absolute;
		top: -10px;
		right: -10px;
		background: #f44336;
		color: white;
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.upload-prompt p {
		font-size: 1.25rem;
		color: #666;
		margin-bottom: 1rem;
	}

	.upload-label {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #667eea;
		color: white;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.upload-label:hover {
		background: #5568d3;
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

	.verify-button {
		margin-bottom: 2rem;
	}

	.items-list {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 2px solid #e0e0e0;
	}

	.items-list h4 {
		margin-bottom: 1rem;
		color: #333;
	}

	.items-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.75rem;
	}

	.item-card {
		padding: 0.75rem;
		background: #f5f5f5;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
	}

	.item-card.current {
		border-color: #667eea;
		background: rgba(102, 126, 234, 0.1);
	}

	.item-card.found {
		background: rgba(76, 175, 80, 0.1);
		border-color: #4caf50;
	}

	.item-number {
		font-weight: 700;
		color: #666;
		font-size: 0.875rem;
	}

	.item-text {
		flex: 1;
		font-size: 0.875rem;
		color: #333;
	}

	.checkmark {
		color: #4caf50;
		font-size: 1.25rem;
		font-weight: 700;
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

	.success {
		background: #e8f5e9;
		color: #2e7d32;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		text-align: center;
		font-weight: 600;
	}
</style>
