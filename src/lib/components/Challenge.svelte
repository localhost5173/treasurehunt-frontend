<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { api, type Challenge, type ChallengeItem } from '$lib/api/api';
	import { authStore } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Select } from '$lib/components/ui/select';
	import { Alert } from '$lib/components/ui/alert';
	import { Separator } from '$lib/components/ui/separator';

	// Optional callback when user quits challenge
	export let onQuit: (() => void) | undefined = undefined;

	// Export functions so parent can call them
	export function resetChallenge() {
		currentChallenge = null;
		showStartForm = true;
		currentItemIndex = 0;
		clearImage();
		error = '';
		clearChallengeStorage();
	}

	export function quitChallenge() {
		currentChallenge = null;
		showStartForm = true;
		currentItemIndex = 0;
		clearImage();
		clearChallengeStorage();

		// Call parent's callback if provided
		if (onQuit) {
			onQuit();
		}
	}

	let currentChallenge: Challenge | null = null;
	let currentItemIndex = 0;
	let loading = false;
	let error = '';
	let showStartForm = true;
	let initializing = true; // Add flag for initial load

	// Form state
	let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
	let totalItems = 10;

	// Track image uploads and verification state for current item
	let imageFile: File | null = null;
	let imagePreview: string = '';
	let verifying = false;
	let message: { type: 'success' | 'error'; text: string } | null = null;

	// Camera capture state
	let showCamera = false;
	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let stream: MediaStream | null = null;
	let cameraError: string = '';
	let capturedPhoto: string = ''; // Temporary storage for confirmation
	let showPhotoConfirmation = false;

	// Get storage key based on user ID
	function getStorageKey(): string {
		const userId = $authStore.user?.id;
		return userId ? `treasurehunt_challenge_${userId}` : 'treasurehunt_challenge';
	}

	// Load challenge from localStorage on mount
	let hasAttemptedLoad = false;

	onMount(() => {
		if (browser) {
			loadChallengeFromStorage();
			hasAttemptedLoad = true;
			// Set initializing to false after a short delay to ensure reactivity has processed
			setTimeout(() => {
				initializing = false;
			}, 100);
		}
	});

	// Reload challenge when user becomes available (in case it wasn't available on mount)
	$: if (browser && $authStore.user && !hasAttemptedLoad) {
		console.log('User became available, attempting to load challenge');
		loadChallengeFromStorage();
		hasAttemptedLoad = true;
		setTimeout(() => {
			initializing = false;
		}, 100);
	}

	function saveChallengeToStorage() {
		if (currentChallenge) {
			const storageKey = getStorageKey();
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					challenge: currentChallenge,
					currentItemIndex,
					showStartForm: false
				})
			);
		}
	}

	function loadChallengeFromStorage() {
		if (!browser) return;

		const storageKey = getStorageKey();
		console.log('Loading challenge with key:', storageKey);
		const stored = localStorage.getItem(storageKey);
		console.log('Stored data:', stored ? 'Found' : 'Not found');

		if (stored) {
			try {
				const data = JSON.parse(stored);
				console.log('Parsed challenge data:', data);
				// Set challenge first to trigger reactivity
				currentChallenge = data.challenge;
				currentItemIndex = data.currentItemIndex || 0;
				// If we have a challenge loaded, don't show the start form
				showStartForm = false;
				console.log(
					'Challenge loaded successfully. showStartForm:',
					showStartForm,
					'currentChallenge:',
					currentChallenge
				);
			} catch (e) {
				console.error('Failed to load challenge from storage:', e);
			}
		}
	}

	function clearChallengeStorage() {
		const storageKey = getStorageKey();
		localStorage.removeItem(storageKey);
	}

	async function startChallenge() {
		const token = $authStore.token;
		if (!token) {
			error = 'Authentication required. Please log in again.';
			return;
		}

		loading = true;
		error = '';

		try {
			console.log('Starting challenge with difficulty:', difficulty, 'items:', totalItems);
			const challenge = await api.challenges.start(token, {
				difficulty,
				totalItems
			});
			console.log('Challenge started:', challenge);

			// Update state - set challenge FIRST, then hide form
			currentItemIndex = 0;
			clearImage();
			currentChallenge = challenge;

			// Wait a tick to ensure reactivity
			await new Promise((resolve) => setTimeout(resolve, 0));

			showStartForm = false;
			saveChallengeToStorage();
		} catch (err: any) {
			console.error('Start challenge error:', err);
			error = err.message || 'Failed to start challenge';
		} finally {
			loading = false;
		}
	}

	async function verifyCurrentItem() {
		if (!currentChallenge || !imageFile) {
			console.log('Missing challenge or image file');
			return;
		}

		const token = $authStore.token;
		if (!token) {
			console.error('No authentication token available');
			message = { type: 'error', text: 'Authentication required. Please log in again.' };
			return;
		}

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
					console.log(
						'Verifying item with challenge ID:',
						currentChallenge!.id,
						'Item ID:',
						currentItem.itemId
					);
					const result = await api.challenges.verifyItem(
						token,
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
					console.error('Verification error:', err);
					message = { type: 'error', text: err.message || 'Failed to verify item' };
				} finally {
					verifying = false;
				}
			};
			reader.readAsDataURL(imageFile);
		} catch (err: any) {
			console.error('Image processing error:', err);
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
		capturedPhoto = '';
		showPhotoConfirmation = false;
		stopCamera();
	}

	async function startCamera() {
		cameraError = '';
		capturedPhoto = '';
		showPhotoConfirmation = false;

		try {
			// First, show the camera UI (this will mount the video element)
			showCamera = true;

			// Wait a tick for the DOM to update and video element to be available
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Request camera access
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'environment', // Prefer back camera on mobile
					width: { ideal: 1920 },
					height: { ideal: 1080 }
				}
			});

			// Attach stream to video element
			if (videoElement) {
				videoElement.srcObject = stream;
				// Wait for video to be ready
				await new Promise<void>((resolve) => {
					videoElement.onloadedmetadata = () => {
						videoElement.play();
						resolve();
					};
				});
			}
		} catch (err: any) {
			console.error('Camera access error:', err);
			if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
				cameraError =
					'Camera permission denied. Please allow camera access in your browser settings.';
			} else if (err.name === 'NotFoundError') {
				cameraError = 'No camera found on this device.';
			} else {
				cameraError = 'Unable to access camera. Please try uploading an image instead.';
			}
			// Keep showCamera true to display the error message
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		showCamera = false;
		cameraError = '';
		capturedPhoto = '';
		showPhotoConfirmation = false;
	}

	function capturePhoto() {
		if (!videoElement || !canvasElement) {
			console.error('Video or canvas element not available');
			return;
		}

		const context = canvasElement.getContext('2d');
		if (!context) {
			console.error('Could not get canvas context');
			return;
		}

		// Set canvas dimensions to match video
		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;

		// Draw the current video frame to canvas
		context.drawImage(videoElement, 0, 0);

		// Get the image as data URL for preview
		capturedPhoto = canvasElement.toDataURL('image/jpeg', 0.9);

		// Show confirmation screen
		showPhotoConfirmation = true;
	}

	function confirmPhoto() {
		if (!capturedPhoto) return;

		// Convert data URL to blob and create file
		fetch(capturedPhoto)
			.then((res) => res.blob())
			.then((blob) => {
				const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
				imageFile = file;
				imagePreview = capturedPhoto;
				message = null;
				stopCamera();
			})
			.catch((err) => {
				console.error('Error creating file from captured photo:', err);
				message = { type: 'error', text: 'Failed to process captured photo' };
			});
	}

	function retakePhoto() {
		capturedPhoto = '';
		showPhotoConfirmation = false;
		// Camera stream is still active, so user can take another photo
	}

	function cancelCamera() {
		stopCamera();
	}

	function toggleCamera() {
		if (showCamera) {
			stopCamera();
		} else {
			startCamera();
		}
	}

	$: progress = currentChallenge
		? (currentChallenge.completedItems / currentChallenge.totalItems) * 100
		: 0;
	$: currentItem = currentChallenge?.items[currentItemIndex];
	$: canGoPrevious = currentItemIndex > 0;
	$: canGoNext = currentChallenge && currentItemIndex < currentChallenge.items.length - 1;
</script>

<div class="challenge-container">
	{#if initializing}
		<Card>
			<CardContent class="loading-state">
				<h2>Loading...</h2>
				<p>Please wait...</p>
			</CardContent>
		</Card>
	{:else if loading}
		<Card>
			<CardContent class="loading-state">
				<h2>Loading Challenge...</h2>
				<p>Please wait while we prepare your treasure hunt.</p>
			</CardContent>
		</Card>
	{:else if showStartForm}
		<Card>
			<CardHeader>
				<CardTitle>Start a New Challenge</CardTitle>
				<CardDescription>Find items in the real world using your camera!</CardDescription>
			</CardHeader>
			<CardContent class="start-form-content">
				<div class="form-group">
					<Label for="difficulty">Difficulty:</Label>
					<select id="difficulty" bind:value={difficulty} class="select-input">
						<option value="easy">Easy</option>
						<option value="medium">Medium</option>
						<option value="hard">Hard</option>
					</select>
				</div>

				<div class="form-group">
					<Label for="totalItems">Number of Items (1-50):</Label>
					<Input
						id="totalItems"
						type="number"
						bind:value={totalItems}
						min="1"
						max="50"
						placeholder="10"
					/>
				</div>

				{#if error}
					<Alert variant="destructive">
						{error}
					</Alert>
				{/if}

				<Button onclick={startChallenge} disabled={loading} class="w-full" size="lg">
					{loading ? 'Starting...' : 'Start Challenge'}
				</Button>
			</CardContent>
		</Card>
	{:else}
		<div class="active-challenge">
			{#if currentChallenge}
				<!-- Challenge info header (no card wrapper) -->
				<div class="challenge-info-header">
					<Badge
						variant={currentChallenge.difficulty === 'easy'
							? 'secondary'
							: currentChallenge.difficulty === 'medium'
								? 'default'
								: 'destructive'}
					>
						{currentChallenge.difficulty.toUpperCase()}
					</Badge>
					<span class="progress-text"
						>{currentChallenge.completedItems} / {currentChallenge.totalItems}</span
					>
				</div>

				{#if currentChallenge.isCompleted}
					<Card class="completion-card">
						<CardContent class="completion-content">
							<h3 class="completion-title">🎉 Completed! 🎉</h3>
							<p>You found all {currentChallenge.totalItems} items!</p>
							<Button onclick={resetChallenge} size="lg">Start New</Button>
						</CardContent>
					</Card>
				{:else if currentItem}
					<!-- Visual indicator - circles for each item -->
					<div class="items-indicator-section">
						{#each currentChallenge.items as item, idx}
							<div
								class="item-circle"
								class:found={item.found}
								class:current={idx === currentItemIndex}
								title="{item.name} - {item.found ? 'Found' : 'Not found'}"
							></div>
						{/each}
					</div>

					<!-- Navigation buttons -->
					<div class="navigation-section">
						<Button
							variant="outline"
							onclick={moveToPreviousItem}
							disabled={!canGoPrevious}
							size="sm"
						>
							← Prev
						</Button>

						<Button variant="outline" onclick={moveToNextItem} disabled={!canGoNext} size="sm">
							Next →
						</Button>
					</div>

					<!-- Current item card -->
					<Card class="current-item-card {currentItem.found ? 'found' : ''}">
						<CardContent class="compact-content">
							<!-- Replace this line in the current item card -->
							<div class="item-name-large">{currentItem.name}</div>

							{#if currentItem.found}
								<div class="found-message">
									<p class="found-icon">✅</p>
									<p class="found-time">
										{new Date(currentItem.foundAt || '').toLocaleTimeString()}
									</p>
								</div>
							{:else}
								<!-- Image upload section -->
								<div class="upload-section-flex">
									{#if imagePreview}
										<div class="image-preview-container">
											<img src={imagePreview} alt="Preview" class="preview-image" />
											<Button
												variant="destructive"
												size="icon"
												class="clear-button"
												onclick={clearImage}
											>
												✕
											</Button>
										</div>
									{:else}
										<div class="take-photo-area">
											<Button onclick={toggleCamera} size="lg" class="camera-button-large w-full">
												📷 Take Photo
											</Button>
										</div>
									{/if}

									{#if message}
										<div class="message-container {message.type}">
											<div class="message-icon">
												{message.type === 'success' ? '✅' : '❌'}
											</div>
											<div class="message-content">
												<div class="message-text">{message.text}</div>
											</div>
										</div>
									{/if}

									{#if imageFile && !currentItem.found}
										<Button
											onclick={verifyCurrentItem}
											disabled={verifying}
											size="lg"
											class="verify-button-large w-full"
										>
											{verifying ? '⏳ Verifying...' : '✓ Verify'}
										</Button>
									{/if}
								</div>
							{/if}
						</CardContent>
					</Card>

					{#if showCamera}
						<div class="camera-container">
							{#if showPhotoConfirmation}
								<!-- Photo confirmation screen -->
								<div class="photo-confirmation">
									<h3 class="confirmation-title">Use this photo?</h3>
									<img src={capturedPhoto} alt="Captured" class="captured-preview" />
									<div class="confirmation-buttons">
										<Button variant="outline" size="lg" onclick={retakePhoto}>🔄 Retake</Button>
										<Button size="lg" onclick={confirmPhoto}>✓ Use Photo</Button>
									</div>
									<Button variant="ghost" onclick={cancelCamera} class="cancel-link">Cancel</Button>
								</div>
							{:else}
								<!-- Live camera view -->
								<div class="camera-view">
									<div class="camera-header">
										<h3 class="camera-title">Take a Photo</h3>
										<Button
											variant="ghost"
											size="icon"
											onclick={cancelCamera}
											class="close-camera-button"
										>
											✕
										</Button>
									</div>
									<!-- svelte-ignore a11y-media-has-caption -->
									<video bind:this={videoElement} autoplay playsinline class="camera-video"></video>
									<canvas bind:this={canvasElement} style="display: none;"></canvas>
									{#if cameraError}
										<div class="camera-error">{cameraError}</div>
									{/if}
									<div class="camera-controls">
										<div class="capture-button-wrapper">
											<button
												onclick={capturePhoto}
												class="capture-button-camera"
												type="button"
												disabled={!!cameraError}
												aria-label="Capture photo"
											>
												<span class="capture-inner"></span>
											</button>
											<span class="capture-label">Capture</span>
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Action buttons at bottom -->
					<div class="action-buttons-bottom">
						<Button variant="secondary" onclick={resetChallenge}>🆕 New</Button>
						<Button variant="destructive" onclick={quitChallenge}>❌ Quit</Button>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Dark Modern Challenge Styles */
	.challenge-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		height: 75vh;
	}

	/* Loading State */
	:global(.loading-state) {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem 2rem;
		border-radius: var(--radius);
		border: 1px solid hsl(var(--border));
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	:global(.loading-state) h2 {
		margin: 0 0 0.5rem 0;
		color: hsl(var(--foreground));
		font-weight: 700;
	}

	:global(.loading-state) p {
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	/* Form Styles */
	:global(.start-form-content) {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.select-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 1rem;
		transition: all 0.2s;
	}

	.select-input:focus {
		outline: none;
		border-color: hsl(var(--ring));
		box-shadow: 0 0 0 3px hsl(var(--ring) / 0.1);
	}

	:global(.w-full) {
		width: 100%;
	}

	/* Active Challenge */
	.active-challenge {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 0 2px;
	}

	.action-buttons-bottom {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
		flex-shrink: 0;
		margin-top: auto;
		padding-top: 0.5rem;
	}

	/* Challenge info header - compact */
	.challenge-info-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: var(--radius);
		border: 1px solid hsl(var(--border));
	}

	.progress-text {
		font-size: 1rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	/* Navigation section */
	.navigation-section {
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 1rem;
		padding: 0.5rem;
		background: hsl(var(--muted) / 0.2);
		border-radius: var(--radius);
		border: 1px solid hsl(var(--border));
	}

	.navigation-section :global(button) {
		background: hsl(var(--primary)) !important;
		color: hsl(var(--primary-foreground)) !important;
		border: 1px solid hsl(var(--primary)) !important;
		font-weight: 700 !important;
	}

	.navigation-section :global(button:hover:not(:disabled)) {
		background: hsl(var(--primary) / 0.9) !important;
	}

	/* Items indicator section - circles for each item */
	.items-indicator-section {
		display: flex;
		gap: 0.4rem;
		justify-content: center;
		flex-wrap: wrap;
		padding: 1rem 0.5rem 1.25rem 0.5rem;
		background: hsl(var(--muted) / 0.2);
		border-radius: var(--radius);
		border: 1px solid hsl(var(--border));
	}

	.item-circle {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #6b7280;
		border: 2px solid #4b5563;
		transition: all 0.2s;
		position: relative;
		flex-shrink: 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.item-circle.found {
		background: #4caf50;
		border-color: #45a049;
		box-shadow:
			0 0 12px rgba(76, 175, 80, 0.7),
			0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.item-circle.current {
		box-shadow:
			0 0 0 3px hsl(var(--primary) / 0.6),
			0 2px 4px rgba(0, 0, 0, 0.4);
		transform: scale(1.15);
		border-width: 3px;
	}

	.item-circle.current::after {
		content: '';
		position: absolute;
		bottom: -8px;
		left: 50%;
		transform: translateX(-50%);
		width: 120%;
		height: 3px;
		background: hsl(var(--primary));
		border-radius: 2px;
		box-shadow: 0 0 6px hsl(var(--primary));
	}

	/* Completion Card */
	:global(.completion-card) {
		border: 2px solid #4caf50;
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
		box-shadow: 0 8px 32px rgba(76, 175, 80, 0.2);
	}

	:global(.completion-content) {
		text-align: center;
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.completion-title {
		font-size: 2rem;
		margin: 0;
		color: #4caf50;
		font-weight: 800;
		text-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
	}

	:global(.completion-content) p {
		font-size: 1rem;
		margin: 0;
		color: hsl(var(--foreground));
	}

	/* Current Item Card */
	:global(.current-item-card) {
		border: 2px solid hsl(var(--primary) / 0.5);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		position: relative;
		overflow: hidden;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		z-index: 1;
	}

	:global(.compact-content) {
		padding: 0.75rem !important;
		flex: 1 !important;
		display: flex !important;
		flex-direction: column !important;
		min-height: 0 !important;
	}

	:global(.current-item-card)::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, hsl(var(--primary)) 0%, transparent 100%);
	}

	:global(.current-item-card.found) {
		border-color: #4caf50;
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, hsl(var(--card)) 100%);
		box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
	}

	:global(.current-item-card.found)::before {
		background: linear-gradient(90deg, #4caf50 0%, transparent 100%);
	}

	.find-instruction {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		text-align: center;
		color: hsl(var(--muted-foreground));
		margin: 0 0 0.25rem 0;
	}

	.item-name-large {
		font-size: clamp(1.25rem, 4vw, 1.75rem);
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 2px;
		text-align: center;
		color: hsl(var(--primary));
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		margin: 0.25rem 0 0.5rem 0;
	}
	
	/* Fallback for browsers that don't support background-clip */
	@supports not (background-clip: text) {
		.item-name-large {
			background: none;
			color: hsl(var(--primary));
			-webkit-text-fill-color: initial;
		}
	}

	@keyframes glow {
		0%,
		100% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.2);
		}
	}

	/* Found message - compact */
	.found-message {
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
		border: 2px solid #4caf50;
		border-radius: var(--radius);
		padding: 1rem;
		text-align: center;
	}

	.found-icon {
		font-size: 2.5rem;
		margin: 0 0 0.25rem 0;
		filter: drop-shadow(0 2px 4px rgba(76, 175, 80, 0.4));
	}

	.found-time {
		color: #4caf50;
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0;
	}

	/* Upload Section */
	.upload-section-flex {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-height: 0;
	}

	.take-photo-area {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--muted) / 0.2);
		border-radius: var(--radius);
		border: 2px dashed hsl(var(--border));
		padding: 2rem;
		min-height: 200px;
	}

	:global(.camera-button-large) {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4) !important;
		transition: all 0.3s !important;
		font-size: 1.25rem !important;
		padding: 1.5rem 2rem !important;
		height: auto !important;
	}

	:global(.camera-button-large:hover) {
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6) !important;
		transform: translateY(-2px) !important;
	}

	.image-preview-container {
		position: relative;
		width: 100%;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #000;
		border-radius: var(--radius);
		overflow: hidden;
		min-height: 200px;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* Verify Button */
	:global(.verify-button-large) {
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%) !important;
		color: white !important;
		font-size: 1.125rem !important;
		font-weight: 800 !important;
		text-transform: uppercase !important;
		letter-spacing: 1px !important;
		box-shadow: 0 4px 16px rgba(76, 175, 80, 0.4) !important;
		transition: all 0.3s !important;
		border: none !important;
		padding: 1rem !important;
		height: auto !important;
	}

	:global(.verify-button-large:hover) {
		box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6) !important;
		transform: translateY(-1px) !important;
	}

	/* Camera Container */
	.camera-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.camera-view,
	.photo-confirmation {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #000;
	}

	.camera-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.camera-title {
		margin: 0;
		font-size: 1.25rem;
		color: white;
		font-weight: 700;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	:global(.close-camera-button) {
		background: transparent;
		border: none;
		color: white;
		font-size: 2rem;
		cursor: pointer;
		padding: 0;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		border-radius: 50%;
	}

	:global(.close-camera-button:hover) {
		background: rgba(255, 255, 255, 0.2);
		transform: rotate(90deg);
	}

	.camera-video {
		flex: 1;
		width: 100%;
		object-fit: cover;
		background: #000;
	}

	.camera-error {
		background: rgba(244, 67, 54, 0.9);
		color: white;
		padding: 1rem;
		margin: 1rem;
		border-radius: var(--radius);
		text-align: center;
		font-size: 0.9rem;
		font-weight: 600;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.camera-controls {
		padding: 2rem;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		justify-content: center;
		align-items: center;
		backdrop-filter: blur(10px);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.capture-button-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.capture-button-camera {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: 5px solid white;
		background: transparent;
		cursor: pointer;
		padding: 6px;
		transition: all 0.2s;
		box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
	}

	.capture-button-camera:active {
		transform: scale(0.9);
	}

	.capture-button-camera:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.capture-inner {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: white;
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.capture-label {
		color: white;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	/* Photo Confirmation */
	.photo-confirmation {
		background: #000;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	.confirmation-title {
		color: white;
		font-size: 1.5rem;
		margin: 0;
		font-weight: 700;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	.captured-preview {
		max-width: 100%;
		max-height: 60vh;
		border-radius: var(--radius);
		object-fit: contain;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	.confirmation-buttons {
		display: flex;
		gap: 1rem;
		width: 100%;
		max-width: 400px;
	}

	:global(.cancel-link) {
		color: rgba(255, 255, 255, 0.7) !important;
		text-decoration: none !important;
		transition: all 0.2s !important;
	}

	:global(.cancel-link:hover) {
		color: white !important;
		text-decoration: underline !important;
	}

	/* Items Overview - REMOVED - Using indicator dots instead */

	/* Message Container Styles */
	.message-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		border-radius: 12px;
		border: 2px solid;
		animation: slideIn 0.3s ease-out, pulse 0.6s ease-out;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(12px);
		position: relative;
		overflow: hidden;
	}

	.message-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0.05;
		background: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 10px,
			currentColor 10px,
			currentColor 20px
		);
		pointer-events: none;
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

	@keyframes pulse {
		0% {
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
		}
		50% {
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3);
		}
		100% {
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
		}
	}

	.message-container.success {
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%);
		border-color: #4caf50;
		color: #4caf50;
		box-shadow: 0 8px 24px rgba(76, 175, 80, 0.25), 0 2px 8px rgba(76, 175, 80, 0.15);
	}

	.message-container.error {
		background: linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.1) 100%);
		border-color: #f44336;
		color: #f44336;
		box-shadow: 0 8px 24px rgba(244, 67, 54, 0.25), 0 2px 8px rgba(244, 67, 54, 0.15);
	}

	.message-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
		filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
		animation: iconPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
		position: relative;
		z-index: 1;
	}

	@keyframes iconPop {
		0% {
			transform: scale(0) rotate(-180deg);
			opacity: 0;
		}
		50% {
			transform: scale(1.3) rotate(10deg);
		}
		100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
	}

	.message-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		position: relative;
		z-index: 1;
	}

	.message-text {
		font-size: 1.0625rem;
		font-weight: 700;
		line-height: 1.5;
		letter-spacing: 0.01em;
		color: hsl(var(--foreground));
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.message-container.success .message-text {
		color: #1b5e20;
	}

	.message-container.error .message-text {
		color: #b71c1c;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.challenge-container {
			padding: 0.25rem;
		}

		.item-name-large {
			font-size: clamp(1.25rem, 4vw, 1.5rem);
			letter-spacing: 1px;
		}

		.completion-title {
			font-size: 1.75rem;
		}

		.action-buttons-bottom {
			flex-direction: row;
			width: 100%;
		}

		.action-buttons-bottom :global(button) {
			flex: 1;
		}

		.item-circle {
			width: 18px;
			height: 18px;
		}

		.items-indicator-section {
			gap: 0.35rem;
		}

		.message-container {
			padding: 1.125rem 1.375rem;
			gap: 0.875rem;
			border-radius: 10px;
		}

		.message-icon {
			font-size: 2.25rem;
		}

		.message-text {
			font-size: 1rem;
			font-weight: 700;
		}
	}

	@media (max-width: 480px) {
		.challenge-container {
			padding: 0.25rem;
		}

		.item-name-large {
			font-size: clamp(1.125rem, 4vw, 1.5rem);
			letter-spacing: 1px;
		}

		.completion-title {
			font-size: 1.5rem;
		}

		:global(.completion-content) {
			padding: 1.5rem 0.75rem;
		}

		.capture-button-camera {
			width: 70px;
			height: 70px;
			border-width: 4px;
		}

		.item-circle {
			width: 16px;
			height: 16px;
		}

		.items-indicator-section {
			gap: 0.3rem;
			padding: 0.75rem 0.5rem 1rem 0.5rem;
		}

		.message-container {
			padding: 1rem 1.25rem;
			gap: 0.75rem;
			border-radius: 8px;
		}

		.message-icon {
			font-size: 2rem;
		}

		.message-text {
			font-size: 0.9375rem;
			font-weight: 700;
		}
	}

	@media (max-width: 360px) {
		.item-name-large {
			font-size: 1rem;
		}

		.item-circle {
			width: 14px;
			height: 14px;
		}

		.items-indicator-section {
			gap: 0.25rem;
		}
	}

	@media (max-height: 600px) and (orientation: landscape) {
		.item-name-large {
			font-size: 1.25rem;
			margin: 0.25rem 0;
		}

		:global(.completion-content) {
			padding: 1rem;
		}
	}

	/* Dark Reader Support */
	@media (prefers-color-scheme: dark) {
		.challenge-container {
			color-scheme: dark;
		}
	}

	/* Ensure images don't get inverted by Dark Reader */
	.preview-image,
	.captured-preview,
	.camera-video {
		color-scheme: only light;
	}
</style>
