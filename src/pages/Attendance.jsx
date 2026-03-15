import { useState, useEffect } from 'react';
import {
  Autocomplete,
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
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Visibility, FilterList, Today, CalendarMonth } from '@mui/icons-material';
import apiService from '../services/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function EmptyAttendanceState({ message }) {
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 240,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Typography variant="h6" color="text.secondary" align="center">
        {message}
      </Typography>
    </Box>
  );
}

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    selectedUser: '',
    dateFrom: new Date().toISOString().split('T')[0], // Today
    dateTo: new Date().toISOString().split('T')[0],   // Today
  });

  const getApiOrigin = () => {
    const baseUrl = apiService.api?.defaults?.baseURL || '';
    return baseUrl.replace(/\/api\/?$/, '');
  };

  const getImageUrl = (path) => {
    if (!path) {
      return '';
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    return `${getApiOrigin()}${path}`;
  };

  const formatDateValue = (value) => {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleDateString();
  };

  const formatDateTimeValue = (value) => {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString();
  };

  const normalizeAttendanceRecord = (record, index) => ({
    id: record.Id || `${record.UserId}-${record.AttendanceDate || index}`,
    ...record,
  });

  const getRecordDate = (record) => record.AttendanceDate || record.InTime?.split(' ')[0] || '';

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
      const todayRecords = data.filter((record) => getRecordDate(record) === today);
      setAttendance(todayRecords.map(normalizeAttendanceRecord));
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
      
      const filtered = data.filter((record) => {
        const recordDate = getRecordDate(record);
        return recordDate >= filters.dateFrom && recordDate <= filters.dateTo;
      });
      
      setAttendance(filtered.map(normalizeAttendanceRecord));
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
    });
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setViewDialog(true);
  };

  const getAttendanceStats = () => {
    const totalRecords = attendance.length;
    const checkedIn = attendance.filter((r) => r.InTime).length;
    const checkedOut = attendance.filter((r) => r.OutTime).length;
    const uniqueUsers = new Set(attendance.map(r => r.UserId)).size;
    
    return { totalRecords, checkedIn, checkedOut, uniqueUsers };
  };

  const stats = getAttendanceStats();
  const emptyStateMessage =
    tabValue === 0 ? 'Attendance not marked yet' : 'No attendance records found';

  const ImageThumbnail = ({ path, label }) => {
    if (!path) {
      return <Typography variant="body2" color="text.secondary">-</Typography>;
    }

    return (
      <Box
        component="img"
        src={getImageUrl(path)}
        alt={label}
        onClick={() => setPreviewImage({ src: getImageUrl(path), label })}
        sx={{
          width: 48,
          height: 48,
          objectFit: 'cover',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          cursor: 'zoom-in',
        }}
      />
    );
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'Name', headerName: 'User', width: 150 },
    { field: 'Email', headerName: 'Email', width: 200 },
    {
      field: 'AttendanceDate',
      headerName: 'Date',
      width: 120,
      valueFormatter: (params) => formatDateValue(params.value),
    },
    {
      field: 'InTime',
      headerName: 'In Time',
      width: 180,
      valueFormatter: (params) => formatDateTimeValue(params.value),
    },
    {
      field: 'OutTime',
      headerName: 'Out Time',
      width: 180,
      valueFormatter: (params) => formatDateTimeValue(params.value),
    },
    {
      field: 'Duration',
      headerName: 'Duration',
      width: 120,
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'PhotoPath_IN',
      headerName: 'In Image',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <ImageThumbnail path={params.value} label={`${params.row.Name} check-in`} />
      ),
    },
    {
      field: 'PhotoPath_OUT',
      headerName: 'Out Image',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <ImageThumbnail path={params.value} label={`${params.row.Name} check-out`} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleView(params.row)} size="small">
            <Visibility />
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
              <Typography color="textSecondary" gutterBottom>Checked In</Typography>
              <Typography variant="h5" color="success.main">{stats.checkedIn}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Checked Out</Typography>
              <Typography variant="h5" color="warning.main">{stats.checkedOut}</Typography>
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
            slots={{
              noRowsOverlay: () => (
                <EmptyAttendanceState message={emptyStateMessage} />
              ),
            }}
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
              <Autocomplete
                fullWidth
                options={users || []}
                getOptionLabel={(option) => option.Name || option.name || ''}
                value={
                  (users || []).find((u) => (u.Id || u.id)?.toString() === filters.selectedUser?.toString()) || null
                }
                onChange={(_, value) =>
                  handleFilterChange('selectedUser', value ? (value.Id || value.id) : '')
                }
                renderInput={(params) => (
                  <TextField {...params} label="User" size="small" />
                )}
              />
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
            slots={{
              noRowsOverlay: () => (
                <EmptyAttendanceState message={emptyStateMessage} />
              ),
            }}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
          />
        </Paper>
      </TabPanel>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Attendance Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 1 }}>
                <strong>User:</strong> {selectedRecord.Name}
              </Box>
              <Box sx={{ mb: 1 }}>
                <strong>Email:</strong> {selectedRecord.Email}
              </Box>
              <Box sx={{ mb: 1 }}>
                <strong>Date:</strong> {formatDateValue(selectedRecord.AttendanceDate)}
              </Box>
              <Box sx={{ mb: 1 }}>
                <strong>In Time:</strong> {formatDateTimeValue(selectedRecord.InTime)}
              </Box>
              <Box sx={{ mb: 1 }}>
                <strong>Out Time:</strong> {formatDateTimeValue(selectedRecord.OutTime)}
              </Box>
              <Box sx={{ mb: 1 }}>
                <strong>Duration:</strong> {selectedRecord.Duration || '-'}
              </Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 1 }}>
                    <strong>In Image:</strong>
                  </Box>
                  <ImageThumbnail path={selectedRecord.PhotoPath_IN} label={`${selectedRecord.Name} check-in`} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 1 }}>
                    <strong>Out Image:</strong>
                  </Box>
                  <ImageThumbnail path={selectedRecord.PhotoPath_OUT} label={`${selectedRecord.Name} check-out`} />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{previewImage?.label || 'Attendance Image'}</DialogTitle>
        <DialogContent>
          {previewImage && (
            <Box
              component="img"
              src={previewImage.src}
              alt={previewImage.label}
              sx={{
                width: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 2,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewImage(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
