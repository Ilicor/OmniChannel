import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Conversations
export const getConversations = async (channel = 'all') => {
  const params = channel !== 'all' ? { channel } : {};
  const response = await axios.get(`${API}/conversations/`, { params });
  return response.data;
};

export const getConversation = async (id) => {
  const response = await axios.get(`${API}/conversations/${id}`);
  return response.data;
};

export const sendMessage = async (conversationId, text) => {
  const response = await axios.post(`${API}/conversations/${conversationId}/messages`, { text });
  return response.data;
};

export const assignConversation = async (conversationId, agentId) => {
  const response = await axios.put(`${API}/conversations/${conversationId}/assign?agent_id=${agentId}`);
  return response.data;
};

export const updateConversationStatus = async (conversationId, status) => {
  const response = await axios.put(`${API}/conversations/${conversationId}/status?status=${status}`);
  return response.data;
};

// Users/Agents
export const getUsers = async () => {
  const response = await axios.get(`${API}/users/`);
  return response.data;
};

export const getAgents = async () => {
  const response = await axios.get(`${API}/users/agents`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axios.post(`${API}/users`, userData);
  return response.data;
};

export const updateUser = async (userId, updates) => {
  const response = await axios.put(`${API}/users/${userId}`, updates);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await axios.delete(`${API}/users/${userId}`);
  return response.data;
};

export const updateUserStatus = async (userId, status) => {
  const response = await axios.put(`${API}/users/${userId}/status?status=${status}`);
  return response.data;
};

// Channels
export const getChannelsSummary = async () => {
  const response = await axios.get(`${API}/channels/summary`);
  return response.data;
};

// WhatsApp
export const getWhatsAppChannels = async () => {
  const response = await axios.get(`${API}/channels/whatsapp`);
  return response.data;
};

export const createWhatsAppChannel = async (data) => {
  const response = await axios.post(`${API}/channels/whatsapp`, data);
  return response.data;
};

export const updateWhatsAppChannel = async (id, data) => {
  const response = await axios.put(`${API}/channels/whatsapp/${id}`, data);
  return response.data;
};

export const deleteWhatsAppChannel = async (id) => {
  const response = await axios.delete(`${API}/channels/whatsapp/${id}`);
  return response.data;
};

export const testWhatsAppChannel = async (id) => {
  const response = await axios.post(`${API}/channels/whatsapp/${id}/test`);
  return response.data;
};

// Facebook
export const getFacebookChannels = async () => {
  const response = await axios.get(`${API}/channels/facebook`);
  return response.data;
};

export const createFacebookChannel = async (data) => {
  const response = await axios.post(`${API}/channels/facebook`, data);
  return response.data;
};

export const updateFacebookChannel = async (id, data) => {
  const response = await axios.put(`${API}/channels/facebook/${id}`, data);
  return response.data;
};

export const deleteFacebookChannel = async (id) => {
  const response = await axios.delete(`${API}/channels/facebook/${id}`);
  return response.data;
};

export const testFacebookChannel = async (id) => {
  const response = await axios.post(`${API}/channels/facebook/${id}/test`);
  return response.data;
};

// Email
export const getEmailChannels = async () => {
  const response = await axios.get(`${API}/channels/email`);
  return response.data;
};

export const createEmailChannel = async (data) => {
  const response = await axios.post(`${API}/channels/email`, data);
  return response.data;
};

export const updateEmailChannel = async (id, data) => {
  const response = await axios.put(`${API}/channels/email/${id}`, data);
  return response.data;
};

export const deleteEmailChannel = async (id) => {
  const response = await axios.delete(`${API}/channels/email/${id}`);
  return response.data;
};

export const testEmailChannel = async (id) => {
  const response = await axios.post(`${API}/channels/email/${id}/test`);
  return response.data;
};

// Automation
export const getAutoResponses = async () => {
  const response = await axios.get(`${API}/automation`);
  return response.data;
};

export const createAutoResponse = async (data) => {
  const response = await axios.post(`${API}/automation`, data);
  return response.data;
};

export const updateAutoResponse = async (id, data) => {
  const response = await axios.put(`${API}/automation/${id}`, data);
  return response.data;
};

export const deleteAutoResponse = async (id) => {
  const response = await axios.delete(`${API}/automation/${id}`);
  return response.data;
};

export const toggleAutoResponse = async (id) => {
  const response = await axios.put(`${API}/automation/${id}/toggle`);
  return response.data;
};

// Chat Flows
export const getChatFlows = async () => {
  const response = await axios.get(`${API}/flows`);
  return response.data;
};

export const createChatFlow = async (data) => {
  const response = await axios.post(`${API}/flows`, data);
  return response.data;
};

export const updateChatFlow = async (id, data) => {
  const response = await axios.put(`${API}/flows/${id}`, data);
  return response.data;
};

export const deleteChatFlow = async (id) => {
  const response = await axios.delete(`${API}/flows/${id}`);
  return response.data;
};

export const toggleChatFlow = async (id) => {
  const response = await axios.put(`${API}/flows/${id}/toggle`);
  return response.data;
};

// Analytics
export const getAnalytics = async () => {
  const response = await axios.get(`${API}/analytics`);
  return response.data;
};

// Settings
export const getSettings = async () => {
  const response = await axios.get(`${API}/settings`);
  return response.data;
};

export const updateGeneralSettings = async (data) => {
  const response = await axios.put(`${API}/settings/general`, data);
  return response.data;
};

export const updateNotificationSettings = async (data) => {
  const response = await axios.put(`${API}/settings/notifications`, data);
  return response.data;
};

export const updateSecuritySettings = async (data) => {
  const response = await axios.put(`${API}/settings/security`, data);
  return response.data;
};

export const updateBusinessHoursSettings = async (data) => {
  const response = await axios.put(`${API}/settings/business-hours`, data);
  return response.data;
};
