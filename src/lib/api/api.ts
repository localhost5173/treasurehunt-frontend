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
	}
};
