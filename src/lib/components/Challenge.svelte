<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { api, type Challenge, type ChallengeItem } from '$lib/api/api';
	import { authStore } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
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
				console.log('Challenge loaded successfully. showStartForm:', showStartForm, 'currentChallenge:', currentChallenge);
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
			await new Promise(resolve => setTimeout(resolve, 0));
			
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
					console.log('Verifying item with challenge ID:', currentChallenge!.id, 'Item ID:', currentItem.itemId);
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
			await new Promise(resolve => setTimeout(resolve, 50));
			
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
				cameraError = 'Camera permission denied. Please allow camera access in your browser settings.';
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
			stream.getTracks().forEach(track => track.stop());
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
			.then(res => res.blob())
			.then(blob => {
				const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
				imageFile = file;
				imagePreview = capturedPhoto;
				message = null;
				stopCamera();
			})
			.catch(err => {
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
			<!-- Action buttons - always visible when not on start form -->
			<div class="action-buttons-top">
				<Button variant="secondary" onclick={resetChallenge}>🆕 New Challenge</Button>
				<Button variant="destructive" onclick={quitChallenge}>❌ Quit Challenge</Button>
			</div>

			{#if currentChallenge}
			<Card class="challenge-main-card">
				<CardHeader>
					<CardTitle>Treasure Hunt Challenge</CardTitle>
					<div class="challenge-info">
						<div class="info-item">
							<span class="label">Difficulty:</span>
							<Badge variant={
								currentChallenge.difficulty === 'easy' ? 'secondary' :
								currentChallenge.difficulty === 'medium' ? 'default' : 'destructive'
							}>
								{currentChallenge.difficulty.toUpperCase()}
							</Badge>
						</div>
						<div class="info-item">
							<span class="label">Progress:</span>
							<span class="value"
								>{currentChallenge.completedItems} / {currentChallenge.totalItems}</span
							>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Progress value={progress} class="mb-6" />

					{#if currentChallenge.isCompleted}
						<Card class="completion-card">
							<CardContent class="completion-content">
								<h3 class="completion-title">🎉 Challenge Completed! 🎉</h3>
								<p>You found all {currentChallenge.totalItems} items!</p>
								<Button onclick={resetChallenge} size="lg">Start New Challenge</Button>
							</CardContent>
						</Card>
					{:else if currentItem}
						<!-- Navigation header -->
						<Card class="navigation-card">
							<CardContent class="navigation-content">
								<Button
									variant="outline"
									onclick={moveToPreviousItem}
									disabled={!canGoPrevious}
									size="sm"
								>
									← Previous
								</Button>
								<div class="item-counter">
									Item {currentItemIndex + 1} of {currentChallenge.totalItems}
								</div>
								<Button
									variant="outline"
									onclick={moveToNextItem}
									disabled={!canGoNext}
									size="sm"
								>
									Next →
								</Button>
							</CardContent>
						</Card>

						<!-- Current item card -->
						<Card class="current-item-card {currentItem.found ? 'found' : ''}">
							<CardContent>
								<div class="item-status-bar">
									<Badge variant="outline">#{currentItem.itemId}</Badge>
									{#if currentItem.found}
										<Badge variant="outline" class="found-badge">✓ Found</Badge>
									{:else}
										<Badge variant="outline" class="pending-badge">🎯 To Find</Badge>
									{/if}
								</div>

								<div class="item-name-large">{currentItem.name}</div>

								{#if currentItem.found}
									<Card class="found-card">
										<CardContent>
											<p class="found-icon">✅ Already found!</p>
											<p class="found-time">
												Found at: {new Date(currentItem.foundAt || '').toLocaleTimeString()}
											</p>
										</CardContent>
									</Card>
								{:else}
									<p class="item-instruction">Find and photograph this item to mark it as complete</p>

									<!-- Image upload section -->
									<div class="upload-section">
										{#if imagePreview}
											<div class="image-preview-large">
												<img src={imagePreview} alt="Preview" />
												<Button
													variant="destructive"
													size="icon"
													class="clear-button"
													onclick={clearImage}
												>
													✕
												</Button>
											</div>
								{:else if showCamera}
									<div class="camera-container">
										{#if showPhotoConfirmation}
											<!-- Photo confirmation screen -->
											<div class="photo-confirmation">
												<h3 class="confirmation-title">Use this photo?</h3>
												<img src={capturedPhoto} alt="Captured" class="captured-preview" />
												<div class="confirmation-buttons">
													<Button variant="outline" size="lg" onclick={retakePhoto}>
														🔄 Retake
													</Button>
													<Button size="lg" onclick={confirmPhoto}>
														✓ Use Photo
													</Button>
												</div>
												<Button variant="ghost" onclick={cancelCamera} class="cancel-link">
													Cancel
												</Button>
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
														<button onclick={capturePhoto} class="capture-button-camera" type="button" disabled={!!cameraError} aria-label="Capture photo">
															<span class="capture-inner"></span>
														</button>
														<span class="capture-label">Capture</span>
													</div>
												</div>
											</div>
										{/if}
									</div>
										{:else}
											<Card class="upload-card">
												<CardContent class="upload-zone">
													<div class="upload-options">
														<Button
															onclick={toggleCamera}
															size="lg"
															class="camera-option-button"
														>
															<span class="option-icon">📷</span>
															<span>Take Photo</span>
														</Button>
														<div class="or-divider">or</div>
														<input
															type="file"
															accept="image/*"
															onchange={handleFileInput}
															style="display: none;"
															id="file-input-current"
														/>
														<label for="file-input-current" class="upload-label-wrapper">
															<Button size="lg" class="upload-label">
																<span class="upload-icon">📁</span>
																<span>Choose Image</span>
															</Button>
														</label>
													</div>
												</CardContent>
											</Card>
										{/if}

										{#if message}
											<Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
												{message.text}
											</Alert>
										{/if}

										{#if imageFile && !currentItem.found}
											<Button
												onclick={verifyCurrentItem}
												disabled={verifying}
												size="lg"
												class="w-full verify-button"
											>
												{verifying ? '⏳ Verifying with AI...' : '✓ Verify Item'}
											</Button>
										{/if}
									</div>
								{/if}
							</CardContent>
						</Card>

						<!-- Progress overview -->
						<Card class="items-overview-card">
							<CardHeader>
								<CardTitle>All Items Overview</CardTitle>
							</CardHeader>
							<CardContent>
								<div class="items-grid-mini">
									{#each currentChallenge.items as item, idx}
										<button
											class="mini-item"
											class:found={item.found}
											class:current={idx === currentItemIndex}
											onclick={() => {
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
							</CardContent>
						</Card>
					{/if}
				</CardContent>
			</Card>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Dark Modern Challenge Styles */
	.challenge-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
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
		gap: 1.5rem;
	}

	.action-buttons-top {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Challenge Card */
	:global(.challenge-main-card) {
		border: 2px solid hsl(var(--primary) / 0.3);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(10px);
	}

	.challenge-info {
		display: flex;
		gap: 2rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: var(--radius);
		border: 1px solid hsl(var(--border));
	}

	.info-item .label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: 600;
	}

	.info-item .value {
		font-size: 1.5rem;
		font-weight: 800;
		color: hsl(var(--foreground));
	}

	:global(.mb-6) {
		margin-bottom: 1.5rem;
	}

	/* Completion Card */
	:global(.completion-card) {
		border: 2px solid #4caf50;
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
		box-shadow: 0 8px 32px rgba(76, 175, 80, 0.2);
	}

	:global(.completion-content) {
		text-align: center;
		padding: 3rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.completion-title {
		font-size: 2.5rem;
		margin: 0;
		color: #4caf50;
		font-weight: 800;
		text-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
	}

	:global(.completion-content) p {
		font-size: 1.125rem;
		margin: 0;
		color: hsl(var(--foreground));
	}

	/* Navigation Card */
	:global(.navigation-card) {
		border: 1px solid hsl(var(--border));
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}

	:global(.navigation-content) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
	}

	.item-counter {
		font-size: 1.125rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		padding: 0.5rem 1rem;
		background: hsl(var(--primary) / 0.1);
		border-radius: var(--radius);
	}

	/* Current Item Card */
	:global(.current-item-card) {
		border: 3px solid hsl(var(--primary) / 0.5);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
		position: relative;
		overflow: hidden;
	}

	:global(.current-item-card)::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, hsl(var(--primary)) 0%, transparent 100%);
	}

	:global(.current-item-card.found) {
		border-color: #4caf50;
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, hsl(var(--card)) 100%);
		box-shadow: 0 12px 40px rgba(76, 175, 80, 0.3);
	}

	:global(.current-item-card.found)::before {
		background: linear-gradient(90deg, #4caf50 0%, transparent 100%);
	}

	.item-status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	:global(.found-badge) {
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%) !important;
		color: white !important;
		border: none !important;
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
		font-weight: 700;
	}

	:global(.pending-badge) {
		background: linear-gradient(135deg, #ff9800 0%, #fb8c00 100%) !important;
		color: white !important;
		border: none !important;
		box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
		font-weight: 700;
	}

	.item-name-large {
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 4px;
		text-align: center;
		background: linear-gradient(135deg, hsl(var(--primary)) 0%, #8b5cf6 50%, #ec4899 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 1.5rem 0;
		animation: glow 3s ease-in-out infinite;
	}

	@keyframes glow {
		0%, 100% { filter: brightness(1); }
		50% { filter: brightness(1.2); }
	}

	.item-instruction {
		text-align: center;
		color: hsl(var(--muted-foreground));
		font-size: 1.125rem;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	/* Found Item Card */
	:global(.found-card) {
		background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
		border: 2px solid #4caf50;
		box-shadow: 0 8px 24px rgba(76, 175, 80, 0.2);
	}

	:global(.found-card) .found-icon {
		font-size: 3rem;
		text-align: center;
		margin: 0 0 0.5rem 0;
		filter: drop-shadow(0 4px 8px rgba(76, 175, 80, 0.4));
	}

	.found-time {
		color: #4caf50;
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		text-align: center;
		text-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
	}

	/* Upload Section */
	.upload-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	:global(.upload-card) {
		border: 3px dashed hsl(var(--border));
		transition: all 0.3s;
		background: hsl(var(--card) / 0.5);
	}

	:global(.upload-card:hover) {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		transform: translateY(-2px);
	}

	:global(.upload-zone) {
		padding: 3rem 2rem;
		text-align: center;
	}

	.upload-options {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	:global(.camera-option-button) {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		min-width: 200px;
		background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%) !important;
		box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4) !important;
		transition: all 0.3s !important;
	}

	:global(.camera-option-button:hover) {
		box-shadow: 0 12px 32px rgba(255, 107, 107, 0.6) !important;
		transform: translateY(-2px) !important;
	}

	.option-icon {
		font-size: 3rem;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	.or-divider {
		color: hsl(var(--muted-foreground));
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 2px;
		position: relative;
		padding: 0 1rem;
	}

	.or-divider::before,
	.or-divider::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 50px;
		height: 1px;
		background: hsl(var(--border));
	}

	.or-divider::before {
		right: 100%;
	}

	.or-divider::after {
		left: 100%;
	}

	.upload-label-wrapper {
		cursor: pointer;
	}

	:global(.upload-label) {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		min-width: 200px;
		cursor: pointer;
		transition: all 0.3s;
	}

	:global(.upload-label:hover) {
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4) !important;
		transform: translateY(-2px) !important;
	}

	.upload-icon {
		font-size: 3rem;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	/* Image Preview */
	.image-preview-large {
		position: relative;
		width: 100%;
		max-height: 400px;
		overflow: hidden;
		border-radius: var(--radius);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		border: 2px solid hsl(var(--border));
	}

	.image-preview-large img {
		width: 100%;
		height: 400px;
		object-fit: cover;
		border-radius: var(--radius);
	}

	:global(.clear-button) {
		position: absolute;
		top: 10px;
		right: 10px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6) !important;
		backdrop-filter: blur(10px);
	}

	/* Verify Button */
	:global(.verify-button) {
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%) !important;
		color: white !important;
		font-size: 1.25rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 2px;
		box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4) !important;
		transition: all 0.3s !important;
		border: none !important;
	}

	:global(.verify-button:hover) {
		box-shadow: 0 12px 32px rgba(76, 175, 80, 0.6) !important;
		transform: translateY(-2px) !important;
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

	.close-camera-button {
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

	.close-camera-button:hover {
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

	/* Items Overview */
	:global(.items-overview-card) {
		background: hsl(var(--muted) / 0.3);
		border: 1px solid hsl(var(--border));
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
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
		background: hsl(var(--background));
		border: 2px solid hsl(var(--border));
		border-radius: var(--radius);
		cursor: pointer;
		font-weight: 800;
		transition: all 0.2s;
		font-size: 1rem;
		color: hsl(var(--foreground));
	}

	.mini-item.current {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.2);
		transform: scale(1.15);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		color: hsl(var(--primary));
		z-index: 1;
	}

	.mini-item.found {
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
		border-color: #4caf50;
		color: white;
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
	}

	.mini-item:hover:not(.current) {
		border-color: hsl(var(--primary));
		transform: scale(1.08);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.challenge-container {
			padding: 1rem;
		}

		.challenge-info {
			gap: 1rem;
		}

		.info-item {
			flex: 1;
			min-width: 120px;
		}

		.info-item .value {
			font-size: 1.25rem;
		}

		.item-name-large {
			font-size: clamp(1.5rem, 4vw, 2rem);
			letter-spacing: 2px;
		}

		:global(.navigation-content) {
			flex-direction: column;
			gap: 1rem;
		}

		.item-counter {
			text-align: center;
			width: 100%;
		}

		.upload-options {
			gap: 1rem;
		}

		.option-icon,
		.upload-icon {
			font-size: 2.5rem;
		}

		:global(.camera-option-button),
		:global(.upload-label) {
			min-width: 180px;
			padding: 1rem 1.5rem;
			font-size: 0.95rem;
		}

		.image-preview-large {
			max-height: 300px;
		}

		.image-preview-large img {
			height: 300px;
		}

		.items-grid-mini {
			grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
			gap: 0.4rem;
		}

		.mini-item {
			font-size: 0.875rem;
		}

		.completion-title {
			font-size: 2rem;
		}

		.action-buttons-top {
			flex-direction: column;
			width: 100%;
		}

		.action-buttons-top :global(button) {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.challenge-container {
			padding: 0.75rem;
		}

		.info-item {
			padding: 0.5rem 0.75rem;
		}

		.info-item .label {
			font-size: 0.7rem;
		}

		.info-item .value {
			font-size: 1.125rem;
		}

		.item-name-large {
			font-size: clamp(1.25rem, 4vw, 1.75rem);
			letter-spacing: 1px;
			margin: 1rem 0;
		}

		.item-instruction {
			font-size: 1rem;
		}

		.upload-options {
			gap: 0.75rem;
		}

		.option-icon,
		.upload-icon {
			font-size: 2rem;
		}

		:global(.camera-option-button),
		:global(.upload-label) {
			min-width: 160px;
			padding: 0.875rem 1.25rem;
			font-size: 0.9rem;
		}

		.image-preview-large {
			max-height: 250px;
		}

		.image-preview-large img {
			height: 250px;
		}

		.items-grid-mini {
			grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
			gap: 0.35rem;
		}

		.mini-item {
			font-size: 0.8rem;
		}

		.completion-title {
			font-size: 1.75rem;
		}

		:global(.completion-content) {
			padding: 2rem 1rem;
		}

		.capture-button-camera {
			width: 70px;
			height: 70px;
			border-width: 4px;
		}
	}

	@media (max-width: 360px) {
		.item-name-large {
			font-size: 1.25rem;
		}

		.items-grid-mini {
			grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
		}
	}

	@media (max-height: 600px) and (orientation: landscape) {
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

		:global(.upload-zone) {
			padding: 1rem;
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
	.image-preview-large img,
	.captured-preview,
	.camera-video {
		color-scheme: only light;
	}
</style>
