import api from '../Config/axios';

// User Service
export const userService = {
  // Get all user groups
  getUserGroups: async () => {
    try {
      const response = await api.get('/user-groups');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user groups');
    }
  },

  // Get user group by ID
  getUserGroupById: async (id) => {
    try {
      const response = await api.get(`/user-groups/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user group');
    }
  },

  // Create a new user group
  createUserGroup: async (groupData) => {
    try {
      const response = await api.post('/user-groups/add', groupData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create user group');
    }
  },

  // Update an existing user group
  updateUserGroup: async (id, groupData) => {
    try {
      const response = await api.put(`/user-groups/${id}`, groupData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user group');
    }
  },

  // Delete a user group
  deleteUserGroup: async (id) => {
    try {
      const response = await api.delete(`/user-groups/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete user group');
    }
  },

  // Get all users
  getUsers: async () => {
    try {
      const response = await api.get('/Users');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await api.get(`/Users/get/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  // Create a new user
  createUser: async (userData) => {
    try {
      const response = await api.post('/Users/add', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  },

  // Update an existing user
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/Users/update/${id}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  // Delete a user
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/Users/delete/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }
};