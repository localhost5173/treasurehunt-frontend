import { writable, get } from 'svelte/store';
import { authStore } from './auth';
import { notificationStore } from './notifications';
import type { Notification } from '$lib/api/api';

interface WebSocketMessage {
	type: string;
	data: any;
	timestamp: string;
}

interface WebSocketState {
	connected: boolean;
	connecting: boolean;
	error: string | null;
}

const WS_URL = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws`;
const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

function createWebSocketStore() {
	const { subscribe, set, update } = writable<WebSocketState>({
		connected: false,
		connecting: false,
		error: null
	});

	let ws: WebSocket | null = null;
	let reconnectAttempts = 0;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let shouldReconnect = true;
	let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

	function connect() {
		const auth = get(authStore);
		if (!auth.token) {
			console.log('No auth token, skipping WebSocket connection');
			return;
		}

		// Don't connect if already connected or connecting
		const currentState = get({ subscribe });
		if (currentState.connected || currentState.connecting) {
			return;
		}

		update(state => ({ ...state, connecting: true, error: null }));

		try {
			// Add token as query parameter for authentication
			const wsUrlWithAuth = `${WS_URL}?token=${auth.token}`;
			ws = new WebSocket(wsUrlWithAuth);

			ws.onopen = () => {
				console.log('WebSocket connected');
				reconnectAttempts = 0;
				update(state => ({ ...state, connected: true, connecting: false, error: null }));

				// Start heartbeat
				startHeartbeat();
			};

			ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					console.log('WebSocket message received:', message);

					if (message.type === 'notification') {
						// Handle incoming notification
						const notification = message.data as Notification;
						notificationStore.addNotification(notification);
					} else if (message.type === 'friend_list_update') {
						// Dispatch custom event to refresh friend lists
						window.dispatchEvent(new CustomEvent('refresh-friends'));
					} else if (message.type === 'battle_list_update') {
						// Dispatch custom event to refresh battle lists
						window.dispatchEvent(new CustomEvent('refresh-battles'));
					} else if (message.type === 'battle_started') {
						// Dispatch custom event with battle ID so challenger can be redirected
						window.dispatchEvent(new CustomEvent('battle-started', { 
							detail: { battleId: message.data.battleId }
						}));
					}
				} catch (error) {
					console.error('Error parsing WebSocket message:', error);
				}
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				update(state => ({ ...state, error: 'WebSocket connection error' }));
			};

			ws.onclose = (event) => {
				console.log('WebSocket closed:', event.code, event.reason);
				update(state => ({ ...state, connected: false, connecting: false }));
				stopHeartbeat();

				// Attempt to reconnect if not a normal closure and we should reconnect
				if (shouldReconnect && event.code !== 1000) {
					scheduleReconnect();
				}
			};
		} catch (error) {
			console.error('Error creating WebSocket:', error);
			update(state => ({
				...state,
				connected: false,
				connecting: false,
				error: 'Failed to create WebSocket connection'
			}));
		}
	}

	function scheduleReconnect() {
		if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
			console.log('Max reconnection attempts reached');
			update(state => ({ ...state, error: 'Max reconnection attempts reached' }));
			return;
		}

		reconnectAttempts++;
		console.log(`Scheduling reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
		}

		reconnectTimeout = setTimeout(() => {
			connect();
		}, RECONNECT_INTERVAL);
	}

	function startHeartbeat() {
		if (heartbeatInterval) {
			clearInterval(heartbeatInterval);
		}

		heartbeatInterval = setInterval(() => {
			if (ws && ws.readyState === WebSocket.OPEN) {
				// Send ping message to keep connection alive
				ws.send(JSON.stringify({ type: 'ping' }));
			}
		}, 30000); // 30 seconds
	}

	function stopHeartbeat() {
		if (heartbeatInterval) {
			clearInterval(heartbeatInterval);
			heartbeatInterval = null;
		}
	}

	function disconnect() {
		shouldReconnect = false;
		stopHeartbeat();

		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
			reconnectTimeout = null;
		}

		if (ws) {
			ws.close(1000, 'Client disconnect');
			ws = null;
		}

		set({
			connected: false,
			connecting: false,
			error: null
		});
	}

	function send(message: any) {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(message));
		} else {
			console.warn('WebSocket is not connected');
		}
	}

	// Listen for auth changes
	authStore.subscribe((auth) => {
		if (auth.token && !get({ subscribe }).connected) {
			// User logged in, connect WebSocket
			shouldReconnect = true;
			connect();
		} else if (!auth.token) {
			// User logged out, disconnect WebSocket
			disconnect();
		}
	});

	return {
		subscribe,
		connect,
		disconnect,
		send
	};
}

export const websocketStore = createWebSocketStore();
