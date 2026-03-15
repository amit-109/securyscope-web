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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Delete, Add, Visibility } from '@mui/icons-material';
import apiService from '../services/api';

export default function StateMaster() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [formData, setFormData] = useState({ stateCode: '', stateName: '', isActive: true });

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const data = await apiService.getStates();
      setStates(
        (data || []).map((s) => ({
          id: s.Id || s.id,
          stateCode: s.StateCode || s.stateCode,
          stateName: s.StateName || s.stateName,
          isActive: s.IsActive === 1 || s.isActive === true,
        }))
      );
    } catch (error) {
      console.error('Error loading states:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ stateCode: '', stateName: '', isActive: true });
    setCreateDialog(true);
  };

  const handleView = (state) => {
    setSelectedState(state);
    setViewDialog(true);
  };

  const handleEdit = (state) => {
    setSelectedState(state);
    setFormData({ stateCode: state.stateCode, stateName: state.stateName, isActive: state.isActive });
    setEditDialog(true);
  };

  const handleSaveCreate = async () => {
    try {
      await apiService.createState({
        StateCode: formData.stateCode,
        StateName: formData.stateName,
        IsActive: formData.isActive ? 1 : 0,
      });
      setCreateDialog(false);
      loadStates();
    } catch (error) {
      console.error('Error creating state:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await apiService.updateState(selectedState.id, {
        StateCode: formData.stateCode,
        StateName: formData.stateName,
        IsActive: formData.isActive ? 1 : 0,
      });
      setEditDialog(false);
      loadStates();
    } catch (error) {
      console.error('Error updating state:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this state?')) {
      try {
        await apiService.deleteState(id);
        loadStates();
      } catch (error) {
        console.error('Error deleting state:', error);
      }
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'stateCode', headerName: 'State Code', width: 130 },
    { field: 'stateName', headerName: 'State Name', width: 220 },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
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
        State Master
      </Typography>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={states}
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

      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>State Details</DialogTitle>
        <DialogContent>
          {selectedState && (
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                <strong>ID:</strong> {selectedState.id}
              </Typography>
              <Typography gutterBottom>
                <strong>State Code:</strong> {selectedState.stateCode}
              </Typography>
              <Typography gutterBottom>
                <strong>State Name:</strong> {selectedState.stateName}
              </Typography>
              <Typography gutterBottom>
                <strong>Active:</strong> {selectedState.isActive ? 'Yes' : 'No'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create State</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="State Code"
              value={formData.stateCode}
              onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="State Name"
              value={formData.stateName}
              onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
              margin="normal"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCreate} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit State</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="State Code"
              value={formData.stateCode}
              onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="State Name"
              value={formData.stateName}
              onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
              margin="normal"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
