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
  Chip,
  Fab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Delete, Add, Visibility } from '@mui/icons-material';
import apiService from '../services/api';

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [formData, setFormData] = useState({
    leave_type: '',
    apply_before: 0,
    is_active: true
  });

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      const data = await apiService.getLeaveTypes();
      setLeaveTypes(data.map(type => ({
        id: type.Id,
        leaveType: type.LeaveType,
        applyBefore: type.ApplyBefore,
        isActive: type.IsActive === 1
      })));
    } catch (error) {
      console.error('Error loading leave types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (leaveType) => {
    setSelectedLeaveType(leaveType);
    setViewDialog(true);
  };

  const handleCreate = () => {
    setFormData({
      leave_type: '',
      apply_before: 0,
      is_active: true
    });
    setCreateDialog(true);
  };

  const handleEdit = (leaveType) => {
    setSelectedLeaveType(leaveType);
    setFormData({
      leave_type: leaveType.leaveType,
      apply_before: leaveType.applyBefore,
      is_active: leaveType.isActive
    });
    setEditDialog(true);
  };

  const handleSaveCreate = async () => {
    try {
      await apiService.createLeaveType(formData);
      setCreateDialog(false);
      loadLeaveTypes();
    } catch (error) {
      console.error('Error creating leave type:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await apiService.updateLeaveType(selectedLeaveType.id, formData);
      setEditDialog(false);
      loadLeaveTypes();
    } catch (error) {
      console.error('Error updating leave type:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave type?')) {
      try {
        await apiService.deleteLeaveType(id);
        loadLeaveTypes();
      } catch (error) {
        console.error('Error deleting leave type:', error);
      }
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'leaveType', headerName: 'Leave Type', width: 200 },
    { field: 'applyBefore', headerName: 'Apply Before (Days)', width: 150 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
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
        Leave Types Management
      </Typography>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={leaveTypes}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreate}
      >
        <Add />
      </Fab>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Leave Type Details</DialogTitle>
        <DialogContent>
          {selectedLeaveType && (
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom><strong>ID:</strong> {selectedLeaveType.id}</Typography>
              <Typography gutterBottom><strong>Leave Type:</strong> {selectedLeaveType.leaveType}</Typography>
              <Typography gutterBottom><strong>Apply Before:</strong> {selectedLeaveType.applyBefore} days</Typography>
              <Typography gutterBottom><strong>Status:</strong> {selectedLeaveType.isActive ? 'Active' : 'Inactive'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Leave Type</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Leave Type Name"
              value={formData.leave_type}
              onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
              margin="normal"
            />
            <TextField
              fullWidth
              type="number"
              label="Apply Before (Days)"
              value={formData.apply_before}
              onChange={(e) => setFormData({...formData, apply_before: parseInt(e.target.value)})}
              margin="normal"
              helperText="Number of days before which leave must be applied"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Leave Type</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Leave Type Name"
              value={formData.leave_type}
              onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
              margin="normal"
            />
            <TextField
              fullWidth
              type="number"
              label="Apply Before (Days)"
              value={formData.apply_before}
              onChange={(e) => setFormData({...formData, apply_before: parseInt(e.target.value)})}
              margin="normal"
              helperText="Number of days before which leave must be applied"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}