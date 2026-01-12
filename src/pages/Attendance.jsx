import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Delete, Visibility, FilterList, Today, CalendarMonth } from '@mui/icons-material';
import apiService from '../services/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    selectedUser: '',
    dateFrom: new Date().toISOString().split('T')[0], // Today
    dateTo: new Date().toISOString().split('T')[0],   // Today
    direction: ''
  });
  const [editData, setEditData] = useState({
    latitude: '',
    longitude: '',
    direction: '',
  });

  useEffect(() => {
    loadUsers();
    loadTodayAttendance();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadTodayAttendance = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAllAttendance();
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = data.filter(record => {
        const recordDate = new Date(record.CreatedAt).toISOString().split('T')[0];
        return recordDate === today;
      });
      setAttendance(todayRecords.map((record, index) => ({
        id: record.Id || index,
        ...record,
      })));
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredAttendance = async () => {
    setLoading(true);
    try {
      let data;
      if (filters.selectedUser) {
        data = await apiService.getAttendanceByUserId(filters.selectedUser);
      } else {
        data = await apiService.getAllAttendance();
      }
      
      // Apply date and direction filters
      const filtered = data.filter(record => {
        const recordDate = new Date(record.CreatedAt).toISOString().split('T')[0];
        const matchesDate = recordDate >= filters.dateFrom && recordDate <= filters.dateTo;
        const matchesDirection = !filters.direction || record.Direction === filters.direction;
        return matchesDate && matchesDirection;
      });
      
      setAttendance(filtered.map((record, index) => ({
        id: record.Id || index,
        ...record,
      })));
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      loadTodayAttendance();
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    loadFilteredAttendance();
  };

  const resetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({
      selectedUser: '',
      dateFrom: today,
      dateTo: today,
      direction: ''
    });
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setEditData({
      latitude: record.Latitude,
      longitude: record.Longitude,
      direction: record.Direction,
    });
    setEditDialog(true);
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setViewDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await apiService.deleteAttendance(id);
        if (tabValue === 0) {
          loadTodayAttendance();
        } else {
          loadFilteredAttendance();
        }
      } catch (error) {
        console.error('Error deleting attendance:', error);
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      await apiService.updateAttendance(selectedRecord.id, editData);
      setEditDialog(false);
      if (tabValue === 0) {
        loadTodayAttendance();
      } else {
        loadFilteredAttendance();
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const getAttendanceStats = () => {
    const totalRecords = attendance.length;
    const inRecords = attendance.filter(r => r.Direction === 'IN').length;
    const outRecords = attendance.filter(r => r.Direction === 'OUT').length;
    const uniqueUsers = new Set(attendance.map(r => r.UserId)).size;
    
    return { totalRecords, inRecords, outRecords, uniqueUsers };
  };

  const stats = getAttendanceStats();

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'Name', headerName: 'User', width: 150 },
    { field: 'Email', headerName: 'Email', width: 200 },
    {
      field: 'Direction',
      headerName: 'Direction',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'IN' ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    { field: 'Latitude', headerName: 'Latitude', width: 120 },
    { field: 'Longitude', headerName: 'Longitude', width: 120 },
    {
      field: 'CreatedAt',
      headerName: 'Date/Time',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleView(params.row)} size="small">
            <Visibility />
          </IconButton>
          <IconButton onClick={() => handleEdit(params.row)} size="small">
            <Edit />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)} size="small" color="error">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Records</Typography>
              <Typography variant="h5">{stats.totalRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Check-ins</Typography>
              <Typography variant="h5" color="success.main">{stats.inRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Check-outs</Typography>
              <Typography variant="h5" color="warning.main">{stats.outRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Users</Typography>
              <Typography variant="h5">{stats.uniqueUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Today />} label="Today's Attendance" />
          <Tab icon={<CalendarMonth />} label="Custom Range" />
        </Tabs>
      </Box>

      {/* Today's Attendance Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={attendance}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
          />
        </Paper>
      </TabPanel>

      {/* Custom Range Tab */}
      <TabPanel value={tabValue} index={1}>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>User</InputLabel>
                <Select
                  value={filters.selectedUser}
                  onChange={(e) => handleFilterChange('selectedUser', e.target.value)}
                  label="User"
                >
                  <MenuItem value="">All Users</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.Id} value={user.Id}>
                      {user.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Direction</InputLabel>
                <Select
                  value={filters.direction}
                  onChange={(e) => handleFilterChange('direction', e.target.value)}
                  label="Direction"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="IN">IN</MenuItem>
                  <MenuItem value="OUT">OUT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FilterList />}
                onClick={applyFilters}
              >
                Apply
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={attendance}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
          />
        </Paper>
      </TabPanel>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Latitude"
            value={editData.latitude}
            onChange={(e) => setEditData({ ...editData, latitude: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Longitude"
            value={editData.longitude}
            onChange={(e) => setEditData({ ...editData, longitude: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Direction"
            value={editData.direction}
            onChange={(e) => setEditData({ ...editData, direction: e.target.value })}
            margin="normal"
          >
            <MenuItem value="IN">IN</MenuItem>
            <MenuItem value="OUT">OUT</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Attendance Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom><strong>ID:</strong> {selectedRecord.Id}</Typography>
              <Typography gutterBottom><strong>User:</strong> {selectedRecord.UserName}</Typography>
              <Typography gutterBottom><strong>Email:</strong> {selectedRecord.UserEmail}</Typography>
              <Typography gutterBottom><strong>Direction:</strong> 
                <Chip 
                  label={selectedRecord.Direction} 
                  color={selectedRecord.Direction === 'IN' ? 'success' : 'warning'} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography gutterBottom><strong>Location:</strong> {selectedRecord.Latitude}, {selectedRecord.Longitude}</Typography>
              <Typography gutterBottom><strong>Date/Time:</strong> {new Date(selectedRecord.CreatedAt).toLocaleString()}</Typography>
              {selectedRecord.PhotoPath && (
                <Box sx={{ mt: 2 }}>
                  <Typography gutterBottom><strong>Photo:</strong></Typography>
                  <img
                    src={`https://api.securyscope.com${selectedRecord.PhotoPath}`}
                    alt="Attendance"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}