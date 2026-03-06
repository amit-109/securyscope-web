import apiService from './api';

class HolidayMasterService {
  async createHoliday(data) {
    const response = await apiService.api.post('/holidays', data);
    return response.data;
  }

  async getAllHolidays() {
    const response = await apiService.api.get('/holidays');
    return response.data;
  }

  async getHolidayById(id) {
    const response = await apiService.api.get(`/holidays/${id}`);
    return response.data;
  }

  async getHolidaysByYear(year) {
    const response = await apiService.api.get('/holidays', {
      params: { year },
    });
    return response.data;
  }

  async updateHoliday(id, data) {
    const response = await apiService.api.put(`/holidays/${id}`, data);
    return response.data;
  }

  async deleteHoliday(id) {
    const response = await apiService.api.delete(`/holidays/${id}`);
    return response.data;
  }
}

const holidayMasterService = new HolidayMasterService();
export default holidayMasterService;
