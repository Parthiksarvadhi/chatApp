import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = "http://192.168.2.28:5000/api";

console.log('API Base URL:', API_BASE_URL);
console.log('Platform:', Platform.OS);

// Helper to make API requests
async function apiCall(endpoint: string, method: string = 'GET', body?: any) {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[${method}] ${url}`);

    const options: any = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      (error as any).response = { data, status: response.status };
      throw error;
    }

    return { data, status: response.status };
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
}

export const authAPI = {
  register: (username: string, email: string, password: string) =>
    apiCall('/auth/register', 'POST', { username, email, password }),
  login: (email: string, password: string) =>
    apiCall('/auth/login', 'POST', { email, password }),
};

export const groupAPI = {
  createGroup: (name: string, description: string) =>
    apiCall('/groups', 'POST', { name, description }),
  listGroups: () => apiCall('/groups', 'GET'),
  getAllGroups: () => apiCall('/groups/all', 'GET'),
  joinGroup: (groupId: number) => apiCall(`/groups/${groupId}/join`, 'POST'),
  getGroupDetails: (groupId: number) => apiCall(`/groups/${groupId}`, 'GET'),
  getGroupMembers: (groupId: number) => apiCall(`/groups/${groupId}/members`, 'GET'),
};

export const messageAPI = {
  sendMessage: (groupId: number, content: string) =>
    apiCall(`/messages/${groupId}/send`, 'POST', { content }),
  getMessages: (groupId: number, limit = 50, offset = 0) =>
    apiCall(`/messages/${groupId}?limit=${limit}&offset=${offset}`, 'GET'),
  deleteMessage: (messageId: number) => apiCall(`/messages/${messageId}`, 'DELETE'),
  markAsRead: (messageId: number) => apiCall(`/messages/${messageId}/read`, 'POST'),
  getReaders: (messageId: number) => apiCall(`/messages/${messageId}/readers`, 'GET'),
  searchMessages: (groupId: number, q: string) =>
    apiCall(`/messages/${groupId}/search?q=${encodeURIComponent(q)}`, 'GET'),
};

export const userAPI = {
  getProfile: () => apiCall('/users/profile', 'GET'),
  updateProfile: (data: any) => apiCall('/users/profile', 'PUT', data),
  getPresence: () => apiCall('/users/presence', 'GET'),
  getGroupPresence: (groupId: number) => apiCall(`/users/groups/${groupId}/presence`, 'GET'),
  savePushToken: (pushToken: string) => apiCall('/users/push-token', 'POST', { pushToken }),
  sendTestNotification: () => apiCall('/users/test-notification', 'POST'),
};

export default { authAPI, groupAPI, messageAPI, userAPI };
