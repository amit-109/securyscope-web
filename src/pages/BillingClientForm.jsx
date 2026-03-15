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
  clientName: '',
  gstin: '',
  address: '',
  city: '',
  stateCode: '',
  pin: '',
  phone: '',
  email: '',
  initials: '',
};

const mapClientToForm = (data) => ({
  clientName: data.clientName || data.ClientName || '',
  gstin: data.gstin || data.GSTIN || '',
  address: data.address || data.Address || '',
  city: data.city || data.City || '',
  stateCode: data.stateCode || data.StateCode || '',
  pin: data.pin || data.Pin || '',
  phone: data.phone || data.Phone || '',
  email: data.email || data.Email || '',
  initials: data.initials || data.Initials || '',
});

export default function BillingClientForm() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const isEditMode = Boolean(clientId);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState([]);

  useEffect(() => {
    const loadStates = async () => {
      try {
        const stateData = await apiService.getStates();
        setStates(stateData || []);
      } catch (loadError) {
        console.error('Error loading states:', loadError);
      }
    };

    loadStates();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadClient = async () => {
      setLoading(true);
      try {
        const data = await apiService.getClientById(clientId);
        setFormData(mapClientToForm(data));
      } catch (loadError) {
        console.error('Error loading client:', loadError);
        setError(loadError.response?.data?.error || 'Failed to load client');
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [clientId, isEditMode]);

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

    if (!formData.clientName.trim()) {
      missingFields.push('Client Name');
    }

    if (!formData.gstin.trim()) {
      missingFields.push('GSTIN');
    }

    if (!formData.address.trim()) {
      missingFields.push('Address');
    }

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
        await apiService.updateClient(clientId, formData);
      } else {
        await apiService.createClient(formData);
      }
      navigate('/billing/client');
    } catch (saveError) {
      console.error('Error saving client:', saveError);
      setError(saveError.response?.data?.error || 'Failed to save client');
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
          {isEditMode ? 'Update Client' : 'Create Client'}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/billing/client')}>
          Back to Clients
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
              <TextField
                fullWidth
                size="small"
                label="Client Name"
                required
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="GSTIN"
                required
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Initials"
                value={formData.initials}
                onChange={(e) => handleChange('initials', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Address"
                required
                multiline
                minRows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="City"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={states || []}
                getOptionLabel={(option) =>
                  option.StateName || option.stateName || option.StateCode || option.stateCode || ''
                }
                value={
                  (states || []).find(
                    (s) => (s.StateCode || s.stateCode)?.toString() === formData.stateCode?.toString()
                  ) || null
                }
                onChange={(_, value) =>
                  handleChange('stateCode', value ? (value.StateCode || value.stateCode) : '')
                }
                disabled={loading || saving}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="State"
                    size="small"
                    placeholder="Select State"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="PIN"
                value={formData.pin}
                onChange={(e) => handleChange('pin', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/billing/client')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading || saving}>
              {isEditMode ? 'Update Client' : 'Create Client'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
