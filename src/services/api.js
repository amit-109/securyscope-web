import axios from 'axios';

const PROD_API_BASE_URL = 'https://api.securyscope.com/api';
const UAT_API_BASE_URL = 'https://uat-api.securyscope.com/api';
const CURRENT_HOSTNAME =
  typeof window !== 'undefined' ? window.location.hostname : '';
const IS_UAT_HOST = CURRENT_HOSTNAME === 'uat.securyscope.com';

const API_BASE_URL = IS_UAT_HOST
  ? UAT_API_BASE_URL
  : import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? PROD_API_BASE_URL : UAT_API_BASE_URL);

const AUTH_EXPIRED_EVENT = 'auth-expired';

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

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
        }

        return Promise.reject(error);
      }
    );
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

  async logout(userId) {
    await this.api.post('/logout', { userId });
  }

  // Attendance APIs
  async getAllAttendance() {
    const response = await this.api.get('/attendance');
    const data = response.data;
    // Add location links to each attendance record (IN + OUT)
    if (Array.isArray(data)) {
      data.forEach(record => {
        if (record.Latitude_IN && record.Longitude_IN) {
          record.locationLinkIn = `https://www.google.com/maps?q=${record.Latitude_IN},${record.Longitude_IN}`;
        }
        if (record.Latitude_OUT && record.Longitude_OUT) {
          record.locationLinkOut = `https://www.google.com/maps?q=${record.Latitude_OUT},${record.Longitude_OUT}`;
        }
      });
    }
    return data;
  }

  async getAttendanceByUserId(userId) {
    const response = await this.api.get(`/attendance/${userId}`);
    const data = response.data;
    // Add location links to each attendance record (IN + OUT)
    if (Array.isArray(data)) {
      data.forEach(record => {
        if (record.Latitude_IN && record.Longitude_IN) {
          record.locationLinkIn = `https://www.google.com/maps?q=${record.Latitude_IN},${record.Longitude_IN}`;
        }
        if (record.Latitude_OUT && record.Longitude_OUT) {
          record.locationLinkOut = `https://www.google.com/maps?q=${record.Latitude_OUT},${record.Longitude_OUT}`;
        }
      });
    }
    return data;
  }

  async updateAttendance(id, data) {
    const response = await this.api.put(`/attendance/${id}`, data);
    return response.data;
  }

  async deleteAttendance(id) {
    const response = await this.api.delete(`/attendance/${id}`);
    return response.data;
  }

  // Billing Clients APIs
  async getClients() {
    const response = await this.api.get('/clients');
    return response.data;
  }

  async getClientById(id) {
    const response = await this.api.get(`/clients/${id}`);
    return response.data;
  }

  async createClient(data) {
    const response = await this.api.post('/clients', data);
    return response.data;
  }

  async updateClient(id, data) {
    const response = await this.api.put(`/clients/${id}`, data);
    return response.data;
  }

  async deleteClient(id) {
    const response = await this.api.delete(`/clients/${id}`);
    return response.data;
  }

  // State Master APIs
  async getStates() {
    const response = await this.api.get('/states');
    return response.data;
  }

  async createState(data) {
    const response = await this.api.post('/states', data);
    return response.data;
  }

  // Contact Person APIs
  async getContactPersons() {
    const response = await this.api.get('/contacts');
    return response.data;
  }

  async getContactPersonById(id) {
    const response = await this.api.get(`/contacts/${id}`);
    return response.data;
  }

  async createContactPerson(data) {
    const response = await this.api.post('/contacts', data);
    return response.data;
  }

  async updateContactPerson(id, data) {
    const response = await this.api.put(`/contacts/${id}`, data);
    return response.data;
  }

  async deleteContactPerson(id) {
    const response = await this.api.delete(`/contacts/${id}`);
    return response.data;
  }

  // Quotation APIs
  async getQuotations() {
    const response = await this.api.get('/quotations');
    return response.data;
  }

  async getQuotationById(id) {
    const response = await this.api.get(`/quotations/${id}`);
    return response.data;
  }

  async createQuotation(data) {
    const response = await this.api.post('/quotations', data);
    return response.data;
  }

  async updateQuotation(id, data) {
    const response = await this.api.put(`/quotations/${id}`, data);
    return response.data;
  }

  async updateQuotationStatus(id, status) {
    const response = await this.api.patch(`/quotations/${id}/status`, { status });
    return response.data;
  }

  async deleteQuotation(id) {
    const response = await this.api.delete(`/quotations/${id}`);
    return response.data;
  }

  async getRevisedQuotation(id) {
    const response = await this.api.get(`/quotations/${id}`);
    return response.data;
  }

  async getQuotationVersions(id) {
    const response = await this.api.get(`/quotations/${id}/versions`);
    return response.data;
  }

  async sendQuotationEmail(id, data) {
    const response = await this.api.post(`/quotation-email/${id}`, data);
    return response.data;
  }

  async downloadQuotationVersion(quotationId, versionId) {
    const response = await this.api.get(
      `/quotations/${quotationId}/versions/${versionId}/download`,
      {
        responseType: 'blob',
      }
    );
    return response;
  }

  async getPurchaseOrders() {
    const response = await this.api.get('/purchase-orders');
    return response.data;
  }

  async createPurchaseOrder(data) {
    const response = await this.api.post('/purchase-orders', data);
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

  // State Code APIs
  async getStates() {
    const response = await this.api.get('/states');
    return response.data;
  }

  async createState(data) {
    const response = await this.api.post('/states', data);
    return response.data;
  }

  async updateState(id, data) {
    const response = await this.api.put(`/states/${id}`, data);
    return response.data;
  }

  async deleteState(id) {
    const response = await this.api.delete(`/states/${id}`);
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
export { AUTH_EXPIRED_EVENT };
export default apiService;
