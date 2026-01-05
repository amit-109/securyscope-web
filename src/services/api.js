import axios from 'axios';

const API_BASE_URL = 'https://api.securyscope.com/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(email, password) {
    const deviceId = 'web-admin-' + Date.now();
    const response = await this.api.post('/login', { 
      email, 
      password, 
      deviceId 
    });
    return response.data;
  }

  async logout() {
    await this.api.post('/logout');
  }

  // Attendance APIs
  async getAllAttendance() {
    const response = await this.api.get('/attendance');
    return response.data;
  }

  async getAttendanceByUserId(userId) {
    const response = await this.api.get(`/attendance/${userId}`);
    return response.data;
  }

  async updateAttendance(id, data) {
    const response = await this.api.put(`/attendance/${id}`, data);
    return response.data;
  }

  async deleteAttendance(id) {
    const response = await this.api.delete(`/attendance/${id}`);
    return response.data;
  }

  // Leave APIs
  async getAllLeaves() {
    const response = await this.api.get('/leaves');
    return response.data;
  }

  async getLeaveById(id) {
    const response = await this.api.get(`/leaves/${id}`);
    return response.data;
  }

  async createLeave(data) {
    const response = await this.api.post('/leaves', data);
    return response.data;
  }

  async updateLeave(id, data) {
    const response = await this.api.put(`/leaves/${id}`, data);
    return response.data;
  }

  async updateLeaveStatus(id, status) {
    const response = await this.api.put(`/leaves/${id}/status`, { status });
    return response.data;
  }

  async deleteLeave(id) {
    const response = await this.api.delete(`/leaves/${id}`);
    return response.data;
  }

  // Leave Types APIs
  async getLeaveTypes() {
    const response = await this.api.get('/leave-types');
    return response.data;
  }

  async createLeaveType(data) {
    const response = await this.api.post('/leave-types', data);
    return response.data;
  }

  async updateLeaveType(id, data) {
    const response = await this.api.put(`/leave-types/${id}`, data);
    return response.data;
  }

  async deleteLeaveType(id) {
    const response = await this.api.delete(`/leave-types/${id}`);
    return response.data;
  }

  // Users APIs
  async getUsers() {
    const response = await this.api.get('/users');
    return response.data;
  }

  async createUser(userData) {
    const response = await this.api.post('/register', userData);
    return response.data;
  }

  async getUserById(id) {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id, userData) {
    const response = await this.api.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id) {
    const response = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  // Force logout user (Admin only)
  async forceLogoutUser(userId) {
    const response = await this.api.post('/logout', { userId });
    return response.data;
  }

  // Check if user is logged in using check-login endpoint
  async checkUserLogin(deviceId) {
    const response = await this.api.post('/check-login', { deviceId });
    return response.data;
  }

  // Get active logged-in users (Admin only)
  async getActiveUsers() {
    const response = await this.api.get('/active-users');
    return response.data;
  }

  // Change Password API
  async changePassword(currentPassword, newPassword, confirmPassword) {
    const response = await this.api.put('/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    return response.data;
  }

  // Roles APIs
  async getRoles() {
    const response = await this.api.get('/roles');
    return response.data;
  }

  async createRole(data) {
    const response = await this.api.post('/roles', data);
    return response.data;
  }

  async updateRole(id, data) {
    const response = await this.api.put(`/roles/${id}`, data);
    return response.data;
  }

  async deleteRole(id) {
    const response = await this.api.delete(`/roles/${id}`);
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;