import { writable } from 'svelte/store';
import { api, type Notification } from '$lib/api/api';
import { authStore } from './auth';
import { get } from 'svelte/store';

interface NotificationState {
	notifications: Notification[];
	unreadCount: number;
	loading: boolean;
}

const initialState: NotificationState = {
	notifications: [],
	unreadCount: 0,
	loading: false
};

function createNotificationStore() {
	const { subscribe, set, update } = writable<NotificationState>(initialState);

	return {
		subscribe,
		
		async fetchNotifications(unreadOnly = false) {
			const auth = get(authStore);
			if (!auth.token) return;

			update((state) => ({ ...state, loading: true }));

			try {
				const notifications = await api.notifications.getNotifications(auth.token, unreadOnly);
				update((state) => ({
					...state,
					notifications,
					loading: false
				}));
			} catch (error) {
				console.error('Failed to fetch notifications:', error);
				update((state) => ({ ...state, loading: false }));
			}
		},

		async fetchUnreadCount() {
			const auth = get(authStore);
			if (!auth.token) return;

			try {
				const count = await api.notifications.getUnreadCount(auth.token);
				update((state) => ({
					...state,
					unreadCount: count
				}));
			} catch (error) {
				console.error('Failed to fetch unread count:', error);
			}
		},

		async markAsRead(notificationId: string) {
			const auth = get(authStore);
			if (!auth.token) return;

			try {
				await api.notifications.markAsRead(auth.token, notificationId);
				update((state) => ({
					...state,
					notifications: state.notifications.map((n) =>
						n.id === notificationId ? { ...n, isRead: true } : n
					),
					unreadCount: Math.max(0, state.unreadCount - 1)
				}));
			} catch (error) {
				console.error('Failed to mark notification as read:', error);
			}
		},

		async markAllAsRead() {
			const auth = get(authStore);
			if (!auth.token) return;

			try {
				await api.notifications.markAllAsRead(auth.token);
				update((state) => ({
					...state,
					notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
					unreadCount: 0
				}));
			} catch (error) {
				console.error('Failed to mark all notifications as read:', error);
			}
		},

		addNotification(notification: Notification) {
			update((state) => ({
				...state,
				notifications: [notification, ...state.notifications],
				unreadCount: state.unreadCount + (notification.isRead ? 0 : 1)
			}));
		},

		reset() {
			set(initialState);
		}
	};
}

export const notificationStore = createNotificationStore();
