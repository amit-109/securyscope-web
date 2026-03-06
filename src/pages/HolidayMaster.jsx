import { useEffect, useState } from 'react';
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
  Chip,
  Fab,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import holidayMasterService from '../services/holidayMaster';

const defaultFormData = {
  HolidayName: '',
  Date: '',
  IsActive: 1,
};

export default function HolidayMaster() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    loadHolidays();
  }, []);

  const mapHoliday = (holiday) => ({
    id: holiday.Id,
    HolidayName: holiday.HolidayName,
    Date: holiday.Date,
    IsActive: holiday.IsActive,
  });

  const loadHolidays = async (year = '') => {
    try {
      setLoading(true);
      const data = year
        ? await holidayMasterService.getHolidaysByYear(year)
        : await holidayMasterService.getAllHolidays();
      setHolidays((data || []).map(mapHoliday));
    } catch (error) {
      console.error('Error loading holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYearFilter = async (value) => {
    setSelectedYear(value);
    await loadHolidays(value);
  };

  const handleCreate = () => {
    setFormData(defaultFormData);
    setCreateDialog(true);
  };

  const handleEdit = (holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      HolidayName: holiday.HolidayName,
      Date: holiday.Date,
      IsActive: holiday.IsActive,
    });
    setEditDialog(true);
  };

  const handleView = async (holiday) => {
    try {
      const data = await holidayMasterService.getHolidayById(holiday.id);
      setSelectedHoliday(mapHoliday(data));
      setViewDialog(true);
    } catch (error) {
      console.error('Error loading holiday details:', error);
    }
  };

  const handleCreateSave = async () => {
    try {
      await holidayMasterService.createHoliday({
        HolidayName: formData.HolidayName,
        Date: formData.Date,
        IsActive: Number(formData.IsActive),
      });
      setCreateDialog(false);
      await loadHolidays(selectedYear);
    } catch (error) {
      console.error('Error creating holiday:', error);
    }
  };

  const handleEditSave = async () => {
    try {
      await holidayMasterService.updateHoliday(selectedHoliday.id, {
        HolidayName: formData.HolidayName,
        Date: formData.Date,
        IsActive: Number(formData.IsActive),
      });
      setEditDialog(false);
      await loadHolidays(selectedYear);
    } catch (error) {
      console.error('Error updating holiday:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      await holidayMasterService.deleteHoliday(id);
      await loadHolidays(selectedYear);
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'HolidayName', headerName: 'Holiday Name', width: 260 },
    {
      field: 'Date',
      headerName: 'Date',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'IsActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === 1 ? 'Active' : 'Inactive'}
          color={params.value === 1 ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleView(params.row)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4">Holiday Master</Typography>
        <TextField
          select
          label="Filter by Year"
          value={selectedYear}
          onChange={(e) => handleYearFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
            <MenuItem key={year} value={String(year)}>
              {year}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={holidays}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      <Fab
        color="primary"
        aria-label="add holiday"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreate}
      >
        <Add />
      </Fab>

      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Holiday Details</DialogTitle>
        <DialogContent>
          {selectedHoliday && (
            <Box sx={{ mt: 1 }}>
              <Typography gutterBottom>
                <strong>ID:</strong> {selectedHoliday.id}
              </Typography>
              <Typography gutterBottom>
                <strong>Holiday Name:</strong> {selectedHoliday.HolidayName}
              </Typography>
              <Typography gutterBottom>
                <strong>Date:</strong> {new Date(selectedHoliday.Date).toLocaleDateString()}
              </Typography>
              <Typography gutterBottom>
                <strong>Status:</strong> {selectedHoliday.IsActive === 1 ? 'Active' : 'Inactive'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Holiday</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Holiday Name"
            margin="normal"
            value={formData.HolidayName}
            onChange={(e) => setFormData({ ...formData, HolidayName: e.target.value })}
          />
          <TextField
            fullWidth
            type="date"
            label="Date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formData.Date}
            onChange={(e) => setFormData({ ...formData, Date: e.target.value })}
          />
          <TextField
            fullWidth
            select
            label="Status"
            margin="normal"
            value={String(formData.IsActive)}
            onChange={(e) => setFormData({ ...formData, IsActive: Number(e.target.value) })}
          >
            <MenuItem value="1">Active</MenuItem>
            <MenuItem value="0">Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSave}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Holiday</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Holiday Name"
            margin="normal"
            value={formData.HolidayName}
            onChange={(e) => setFormData({ ...formData, HolidayName: e.target.value })}
          />
          <TextField
            fullWidth
            type="date"
            label="Date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formData.Date}
            onChange={(e) => setFormData({ ...formData, Date: e.target.value })}
          />
          <TextField
            fullWidth
            select
            label="Status"
            margin="normal"
            value={String(formData.IsActive)}
            onChange={(e) => setFormData({ ...formData, IsActive: Number(e.target.value) })}
          >
            <MenuItem value="1">Active</MenuItem>
            <MenuItem value="0">Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
