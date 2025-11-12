const API_BASE_URL = 'http://localhost:8080/api';

export interface SignupData {
	email: string;
	password: string;
	name: string;
}

export interface LoginData {
	email: string;
	password: string;
}

export interface AuthResponse {
	token: string;
	user: {
		id: string;
		email: string;
		name: string;
		googleId?: string;
		profileImage?: string;
		createdAt: string;
		updatedAt: string;
	};
}

export interface ImageAnalysisRequest {
	imageUrl?: string;
	imageBase64?: string;
	prompt: string;
}

export interface ImageAnalysisResponse {
	result: boolean;
}

export interface ChallengeItem {
	itemId: number;
	name: string;
	found: boolean;
	foundAt?: string;
}

export interface Challenge {
	id: string;
	userId: string;
	battleId?: string;
	difficulty: 'easy' | 'medium' | 'hard';
	totalItems: number;
	items: ChallengeItem[];
	completedItems: number;
	isCompleted: boolean;
	createdAt: string;
	updatedAt: string;
	completedAt?: string;
}

export interface StartChallengeRequest {
	difficulty: 'easy' | 'medium' | 'hard';
	totalItems: number;
}

export interface VerifyItemRequest {
	imageUrl?: string;
	imageBase64?: string;
}

export interface VerifyItemResponse {
	found: boolean;
	message: string;
	challenge?: Challenge;
}

// Friend-related interfaces
export interface FriendRequest {
	id: string;
	fromUserId: string;
	toUserId: string;
	status: 'pending' | 'accepted' | 'rejected';
	createdAt: string;
	updatedAt: string;
	fromUser?: User;
}

export interface Friend {
	user: User;
	isOnline: boolean;
	friendId: string;
}

export interface Notification {
	id: string;
	userId: string;
	type: 'friend_request' | 'battle_invite' | 'battle_accept' | 'friend_accept';
	fromUser: string;
	referenceId?: string;
	message: string;
	isRead: boolean;
	createdAt: string;
	fromUserData?: User;
}

// Battle-related interfaces
export interface BattleParticipant {
	userId: string;
	challengeId?: string;
	completedItems: number;
	isCompleted: boolean;
	completedAt?: string;
	hasAccepted: boolean;
}

export interface Battle {
	id: string;
	challengerId: string;
	opponentId: string;
	difficulty: 'easy' | 'medium' | 'hard';
	totalItems: number;
	items: ChallengeItem[];
	participants: BattleParticipant[];
	status: 'pending' | 'active' | 'completed' | 'declined';
	winnerId?: string;
	createdAt: string;
	updatedAt: string;
	completedAt?: string;
	challenger?: User;
	opponent?: User;
}

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

export interface CreateBattleRequest {
	opponentId: string;
	difficulty: 'easy' | 'medium' | 'hard';
	totalItems: number;
}

export class APIError extends Error {
	constructor(public status: number, message: string) {
		super(message);
		this.name = 'APIError';
	}
}

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new APIError(response.status, error.error || 'Request failed');
	}
	return response.json();
}

export const api = {
	auth: {
		signup: async (data: SignupData): Promise<AuthResponse> => {
			const response = await fetch(`${API_BASE_URL}/auth/signup`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			return handleResponse<AuthResponse>(response);
		},

		login: async (data: LoginData): Promise<AuthResponse> => {
			const response = await fetch(`${API_BASE_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			return handleResponse<AuthResponse>(response);
		},

		me: async (token: string) => {
			const response = await fetch(`${API_BASE_URL}/auth/me`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse(response);
		}
	},

	image: {
		analyze: async (token: string, data: ImageAnalysisRequest): Promise<ImageAnalysisResponse> => {
			const response = await fetch(`${API_BASE_URL}/getImageContents`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(data)
			});
			return handleResponse<ImageAnalysisResponse>(response);
		}
	},

	challenges: {
		start: async (token: string, data: StartChallengeRequest): Promise<Challenge> => {
			const response = await fetch(`${API_BASE_URL}/challenges/start`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(data)
			});
			return handleResponse<Challenge>(response);
		},

		getAll: async (token: string): Promise<Challenge[]> => {
			const response = await fetch(`${API_BASE_URL}/challenges`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<Challenge[]>(response);
		},

		getById: async (token: string, challengeId: string): Promise<Challenge> => {
			const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<Challenge>(response);
		},

		verifyItem: async (
			token: string,
			challengeId: string,
			itemId: number,
			data: VerifyItemRequest
		): Promise<VerifyItemResponse> => {
			const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/${itemId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(data)
			});
			return handleResponse<VerifyItemResponse>(response);
		}
	},

	friends: {
		sendFriendRequest: async (token: string, email: string): Promise<FriendRequest> => {
			const response = await fetch(`${API_BASE_URL}/friends/request`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ email })
			});
			return handleResponse<FriendRequest>(response);
		},

		getFriendRequests: async (token: string): Promise<FriendRequest[]> => {
			const response = await fetch(`${API_BASE_URL}/friends/requests`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<FriendRequest[]>(response);
		},

		acceptFriendRequest: async (token: string, requestId: string): Promise<void> => {
			const response = await fetch(`${API_BASE_URL}/friends/requests/${requestId}/accept`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<void>(response);
		},

		rejectFriendRequest: async (token: string, requestId: string): Promise<void> => {
			const response = await fetch(`${API_BASE_URL}/friends/requests/${requestId}/reject`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<void>(response);
		},

		getFriends: async (token: string): Promise<Friend[]> => {
			const response = await fetch(`${API_BASE_URL}/friends`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<Friend[]>(response);
		},

		updateOnlineStatus: async (token: string, isOnline: boolean): Promise<void> => {
			const response = await fetch(`${API_BASE_URL}/friends/online`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ isOnline })
			});
			return handleResponse<void>(response);
		},

		searchByEmail: async (token: string, email: string): Promise<User> => {
			const response = await fetch(`${API_BASE_URL}/friends/search?email=${encodeURIComponent(email)}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<User>(response);
		}
	},

	notifications: {
		getNotifications: async (token: string, unreadOnly = false): Promise<Notification[]> => {
			const url = unreadOnly 
				? `${API_BASE_URL}/notifications?unreadOnly=true`
				: `${API_BASE_URL}/notifications`;
			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<Notification[]>(response);
		},

		markAsRead: async (token: string, notificationId: string): Promise<void> => {
			const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<void>(response);
		},

		markAllAsRead: async (token: string): Promise<void> => {
			const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<void>(response);
		},

		getUnreadCount: async (token: string): Promise<number> => {
			const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			const data = await handleResponse<{ count: string }>(response);
			return parseInt(data.count);
		}
	},

	battles: {
		createBattle: async (token: string, data: CreateBattleRequest): Promise<Battle> => {
			const response = await fetch(`${API_BASE_URL}/battles`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(data)
			});
			return handleResponse<Battle>(response);
		},

		getBattles: async (token: string): Promise<Battle[]> => {
			const response = await fetch(`${API_BASE_URL}/battles`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<Battle[]>(response);
		},

		getActiveBattles: async (token: string): Promise<Battle[]> => {
			const response = await fetch(`${API_BASE_URL}/battles/active`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<Battle[]>(response);
		},

		getBattle: async (token: string, battleId: string): Promise<Battle> => {
			const response = await fetch(`${API_BASE_URL}/battles/${battleId}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<Battle>(response);
		},

		acceptBattle: async (token: string, battleId: string): Promise<void> => {
			const response = await fetch(`${API_BASE_URL}/battles/${battleId}/accept`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<void>(response);
		},

		declineBattle: async (token: string, battleId: string): Promise<void> => {
			const response = await fetch(`${API_BASE_URL}/battles/${battleId}/decline`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<void>(response);
		},

		joinBattle: async (token: string, battleId: string): Promise<Challenge> => {
			const response = await fetch(`${API_BASE_URL}/battles/${battleId}/join`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return handleResponse<Challenge>(response);
		}
	}
};

