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

export default function BillingContactPersons() {
  const [contacts, setContacts] = useState([]);
  const [clientsById, setClientsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const normalizeContact = (contact, index) => ({
    id: contact.Id || contact.id || index,
    Id: contact.Id || contact.id || index,
    clientId: contact.ClientId || contact.clientId,
    ClientId: contact.ClientId || contact.clientId,
    name: contact.Name || contact.name,
    Name: contact.Name || contact.name,
    designation: contact.Designation || contact.designation,
    Designation: contact.Designation || contact.designation,
    mobileNumber: contact.MobileNumber || contact.mobileNumber,
    MobileNumber: contact.MobileNumber || contact.mobileNumber,
    phoneNumber: contact.PhoneNumber || contact.phoneNumber,
    PhoneNumber: contact.PhoneNumber || contact.phoneNumber,
    email: contact.Email || contact.email,
    Email: contact.Email || contact.email,
    ...contact,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [contactsData, clientsData] = await Promise.all([
        apiService.getContactPersons(),
        apiService.getClients(),
      ]);

      const clientMap = (clientsData || []).reduce((acc, client) => {
        const id = client.Id || client.id;
        if (id !== undefined) {
          acc[id] = client;
        }
        return acc;
      }, {});

      setClientsById(clientMap);
      setContacts((contactsData || []).map(normalizeContact));
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/billing/contacts/new');
  };

  const handleView = async (contact) => {
    try {
      const data = await apiService.getContactPersonById(contact.Id || contact.id);
      setSelectedContact(data);
      setViewDialog(true);
    } catch (error) {
      console.error('Error loading contact:', error);
    }
  };

  const handleEdit = async (contact) => {
    const id = contact.Id || contact.id;
    navigate(`/billing/contacts/${id}/edit`);
  };

  const handleDelete = async (contact) => {
    const id = contact.Id || contact.id;
    const name = contact.name || contact.Name;

    if (!window.confirm(`Are you sure you want to delete contact "${name}"?`)) {
      return;
    }

    try {
      await apiService.deleteContactPerson(id);
      loadData();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const columns = [
    { field: 'Id', headerName: 'ID', width: 90 },
    {
      field: 'clientId',
      headerName: 'Client',
      width: 220,
      valueGetter: (params) => {
        const clientId = params.row.clientId || params.row.ClientId;
        const client = clientsById[clientId];
        return client?.clientName || client?.ClientName || `#${clientId}`;
      },
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      valueGetter: (params) => params.row.name || params.row.Name || '',
    },
    {
      field: 'designation',
      headerName: 'Designation',
      width: 160,
      valueGetter: (params) => params.row.designation || params.row.Designation || '',
    },
    {
      field: 'mobileNumber',
      headerName: 'Mobile',
      width: 150,
      valueGetter: (params) => params.row.mobileNumber || params.row.MobileNumber || '',
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: 150,
      valueGetter: (params) => params.row.phoneNumber || params.row.PhoneNumber || '',
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
      width: 160,
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

  const renderContactDetails = (contact) => {
    if (!contact) {
      return null;
    }

    const client = clientsById[contact.clientId || contact.ClientId];

    return (
      <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
        <Box><strong>ID:</strong> {contact.Id || contact.id}</Box>
        <Box><strong>Client:</strong> {client?.clientName || client?.ClientName || contact.clientId || contact.ClientId}</Box>
        <Box><strong>Name:</strong> {contact.name || contact.Name}</Box>
        <Box><strong>Designation:</strong> {contact.designation || contact.Designation}</Box>
        <Box><strong>Mobile:</strong> {contact.mobileNumber || contact.MobileNumber}</Box>
        <Box><strong>Phone:</strong> {contact.phoneNumber || contact.PhoneNumber}</Box>
        <Box><strong>Email:</strong> {contact.email || contact.Email}</Box>
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
        <Typography variant="h4">Billing Contact Persons</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
          Create Contact Person
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={contacts}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Person Details</DialogTitle>
        <DialogContent>{renderContactDetails(selectedContact)}</DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
