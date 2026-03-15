import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';

const initialFormData = {
  clientId: '',
  name: '',
  designation: '',
  mobileNumber: '',
  phoneNumber: '',
  email: '',
};

const mapContactToForm = (data) => ({
  clientId: data.clientId || data.ClientId || '',
  name: data.name || data.Name || '',
  designation: data.designation || data.Designation || '',
  mobileNumber: data.mobileNumber || data.MobileNumber || '',
  phoneNumber: data.phoneNumber || data.PhoneNumber || '',
  email: data.email || data.Email || '',
});

export default function BillingContactPersonForm() {
  const navigate = useNavigate();
  const { contactId } = useParams();
  const isEditMode = Boolean(contactId);

  const [formData, setFormData] = useState(initialFormData);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await apiService.getClients();
        setClients(clientsData || []);
      } catch (loadError) {
        console.error('Error loading clients:', loadError);
      }
    };

    loadClients();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadContact = async () => {
      setLoading(true);
      try {
        const data = await apiService.getContactPersonById(contactId);
        setFormData(mapContactToForm(data));
      } catch (loadError) {
        console.error('Error loading contact:', loadError);
        setError(loadError.response?.data?.error || 'Failed to load contact');
      } finally {
        setLoading(false);
      }
    };

    loadContact();
  }, [contactId, isEditMode]);

  const handleChange = (field, value) => {
    if (error) {
      setError('');
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const missingFields = [];

    if (!formData.clientId) missingFields.push('Client');
    if (!formData.name.trim()) missingFields.push('Name');
    if (!formData.designation.trim()) missingFields.push('Designation');

    if (missingFields.length > 0) {
      setError(`${missingFields.join(', ')} required`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEditMode) {
        await apiService.updateContactPerson(contactId, formData);
      } else {
        await apiService.createContactPerson(formData);
      }
      navigate('/billing/contacts');
    } catch (saveError) {
      console.error('Error saving contact:', saveError);
      setError(saveError.response?.data?.error || 'Failed to save contact');
    } finally {
      setSaving(false);
    }
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
          {isEditMode ? 'Update Contact Person' : 'Create Contact Person'}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/billing/contacts')}>
          Back to Contacts
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 2, md: 3 }, maxWidth: 980 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={clients || []}
                getOptionLabel={(option) =>
                  option.clientName || option.ClientName || `Client ${option.Id || option.id || ''}`
                }
                value={
                  (clients || []).find(
                    (c) => (c.Id || c.id)?.toString() === formData.clientId?.toString()
                  ) || null
                }
                onChange={(_, value) =>
                  handleChange('clientId', value ? (value.Id || value.id) : '')
                }
                disabled={loading || saving}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Client"
                    size="small"
                    placeholder="Select Client"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Designation"
                required
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Mobile Number"
                value={formData.mobileNumber}
                onChange={(e) => handleChange('mobileNumber', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/billing/contacts')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading || saving}>
              {isEditMode ? 'Update Contact' : 'Create Contact'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
