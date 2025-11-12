import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	id: string;
	email: string;
	name: string;
	googleId?: string;
	profileImage?: string;
	isOnline?: boolean;
	lastActive?: string;
	createdAt: string;
	updatedAt: string;
}

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
}

const initialState: AuthState = {
	user: null,
	token: browser ? localStorage.getItem('token') : null,
	isAuthenticated: false
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		login: (token: string, user: User) => {
			if (browser) {
				localStorage.setItem('token', token);
			}
			set({
				user,
				token,
				isAuthenticated: true
			});
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem('token');
			}
			set({
				user: null,
				token: null,
				isAuthenticated: false
			});
		},
		setUser: (user: User) => {
			update((state) => ({
				...state,
				user,
				isAuthenticated: true
			}));
		},
		checkAuth: async () => {
			const token = browser ? localStorage.getItem('token') : null;
			if (!token) {
				return false;
			}

			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/me`, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (response.ok) {
					const user = await response.json();
					set({
						user,
						token,
						isAuthenticated: true
					});
					return true;
				} else {
					// Invalid token, clear it
					if (browser) {
						localStorage.removeItem('token');
					}
					set({
						user: null,
						token: null,
						isAuthenticated: false
					});
					return false;
				}
			} catch (error) {
				console.error('Auth check failed:', error);
				return false;
			}
		}
	};
}

export const authStore = createAuthStore();
