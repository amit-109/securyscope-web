import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

export default function BillingClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadClients();
  }, []);

  const normalizeClient = (client, index) => ({
    id: client.Id || client.id || index,
    ...client,
  });

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await apiService.getClients();
      setClients(data.map(normalizeClient));
    } catch (loadError) {
      console.error('Error loading clients:', loadError);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/billing/client/new');
  };

  const handleView = async (client) => {
    try {
      const data = await apiService.getClientById(client.Id || client.id);
      setSelectedClient(data);
      setViewDialog(true);
    } catch (viewError) {
      console.error('Error loading client details:', viewError);
    }
  };

  const handleEdit = async (client) => {
    try {
      const data = await apiService.getClientById(client.Id || client.id);
      navigate(`/billing/client/${data.Id || data.id}/edit`);
    } catch (editError) {
      console.error('Error loading client details:', editError);
    }
  };

  const handleDelete = async (client) => {
    const clientId = client.Id || client.id;
    const clientName = client.clientName || client.ClientName;

    if (!window.confirm(`Are you sure you want to delete client "${clientName}"?`)) {
      return;
    }

    try {
      await apiService.deleteClient(clientId);
      loadClients();
    } catch (deleteError) {
      console.error('Error deleting client:', deleteError);
    }
  };

  const columns = [
    { field: 'Id', headerName: 'ID', width: 80 },
    {
      field: 'clientName',
      headerName: 'Client Name',
      width: 220,
      valueGetter: (params) => params.row.clientName || params.row.ClientName || '',
    },
    {
      field: 'gstin',
      headerName: 'GSTIN',
      width: 170,
      valueGetter: (params) => params.row.gstin || params.row.GSTIN || '',
    },
    {
      field: 'city',
      headerName: 'City',
      width: 130,
      valueGetter: (params) => params.row.city || params.row.City || '',
    },
    {
      field: 'stateCode',
      headerName: 'State Code',
      width: 110,
      valueGetter: (params) => params.row.stateCode || params.row.StateCode || '',
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      valueGetter: (params) => params.row.phone || params.row.Phone || '',
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
      valueGetter: (params) => params.row.email || params.row.Email || '',
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
          <IconButton onClick={() => handleDelete(params.row)} size="small" color="error">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  const renderClientDetails = (client) => {
    if (!client) {
      return null;
    }

    return (
      <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
        <Box><strong>ID:</strong> {client.Id || client.id}</Box>
        <Box><strong>Client Name:</strong> {client.clientName || client.ClientName}</Box>
        <Box><strong>GSTIN:</strong> {client.gstin || client.GSTIN}</Box>
        <Box><strong>Initials:</strong> {client.initials || client.Initials || '-'}</Box>
        <Box><strong>Address:</strong> {client.address || client.Address}</Box>
        <Box><strong>City:</strong> {client.city || client.City}</Box>
        <Box><strong>State Code:</strong> {client.stateCode || client.StateCode}</Box>
        <Box><strong>PIN:</strong> {client.pin || client.Pin}</Box>
        <Box><strong>Phone:</strong> {client.phone || client.Phone}</Box>
        <Box><strong>Email:</strong> {client.email || client.Email}</Box>
      </Box>
    );
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4">
        Billing Client Master
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
          Create Client
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={clients}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Client Details</DialogTitle>
        <DialogContent>{renderClientDetails(selectedClient)}</DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
