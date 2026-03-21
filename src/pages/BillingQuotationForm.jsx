import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';

const initialFormData = {
  quotationNumber: '',
  quotationDate: '',
  revisionNumber: 0,
  clientId: '',
  contactPersonId: '',
  endUser: '',
  proposalDetails: '',
  status: 'Draft',
  items: [
    {
      description: '',
      hsn_sac: '',
      unit: '',
      quantity: 1,
      purchasePrice: 0,
      factor: 1,
    },
  ],
};

const roundRate = (purchasePrice, factor) => {
  const parsedPurchasePrice = Number(purchasePrice) || 0;
  const parsedFactor = Number(factor) || 0;

  if (!parsedFactor) {
    return 0;
  }

  return Math.round(parsedPurchasePrice / parsedFactor);
};

const mapQuotationToForm = (data) => {
  const rawItems =
    data.items ||
    data.Items ||
    data.quotationItems ||
    data.QuotationItems ||
    data.lineItems ||
    data.LineItems ||
    [];

  const items = Array.isArray(rawItems)
    ? rawItems.map((item) => {
        const purchasePrice =
          item.purchasePrice ??
          item.PurchasePrice ??
          item.purchase_price ??
          item.Purchase_Price;
        const factor = item.factor ?? item.Factor;
        const rate = item.rate ?? item.Rate ?? item.unitPrice ?? item.UnitPrice ?? 0;

        return {
          description:
            item.description ||
            item.Description ||
            item.itemDescription ||
            item.ItemDescription ||
            item.productDescription ||
            item.ProductDescription ||
            '',
          hsn_sac:
            item.hsn_sac || item.Hsn_Sac || item.HSN_SAC || item.hsnSac || item.HsnSac || '',
          unit: item.unit || item.Unit || '',
          quantity: item.quantity ?? item.Quantity ?? item.qty ?? item.Qty ?? 1,
          purchasePrice: purchasePrice ?? rate,
          factor: factor ?? 1,
        };
      })
    : [
        {
          description: '',
          hsn_sac: '',
          unit: '',
          quantity: 1,
          purchasePrice: 0,
          factor: 1,
        },
      ];

  return {
    quotationNumber: data.QuotationNumber || data.quotationNumber || '',
    quotationDate: data.QuotationDate || data.quotationDate || '',
    revisionNumber: data.RevisionNumber || data.revisionNumber || 0,
    clientId: data.clientId || data.ClientId || '',
    contactPersonId: data.contactPersonId || data.ContactPersonId || '',
    endUser: data.endUser || data.EndUser || '',
    proposalDetails: data.proposalDetails || data.ProposalDetails || '',
    status: data.status || data.Status || 'Draft',
    items,
  };
};

export default function BillingQuotationForm() {
  const navigate = useNavigate();
  const { quotationId } = useParams();
  const isEditMode = Boolean(quotationId);

  const [formData, setFormData] = useState(initialFormData);
  const [clients, setClients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [clientsData, contactsData] = await Promise.all([
          apiService.getClients(),
          apiService.getContactPersons(),
        ]);
        setClients(clientsData || []);
        setContacts(contactsData || []);
      } catch (loadError) {
        console.error('Error loading lookups:', loadError);
      }
    };

    loadLookups();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadQuotation = async () => {
      setLoading(true);
      try {
        const data = await apiService.getQuotationById(quotationId);
        setFormData(mapQuotationToForm(data));
      } catch (loadError) {
        console.error('Error loading quotation:', loadError);
        setError(loadError.response?.data?.error || 'Failed to load quotation');
      } finally {
        setLoading(false);
      }
    };

    loadQuotation();
  }, [quotationId, isEditMode]);

  const handleChange = (field, value) => {
    if (error) {
      setError('');
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const statuses = ['Draft', 'Sent', 'Final', 'ConvertedToPO'];

  const toggleStatus = () => {
    setFormData((prev) => {
      const currentIndex = statuses.indexOf(prev.status);
      const nextIndex = (currentIndex + 1) % statuses.length;
      return {
        ...prev,
        status: statuses[nextIndex],
      };
    });
  };

  const calculateItemAmount = (item) => {
    const qty = Number(item.quantity) || 0;
    const rate = roundRate(item.purchasePrice, item.factor);
    return qty * rate;
  };

  const calculateTotalAmount = () => {
    return (formData.items || []).reduce((sum, item) => sum + calculateItemAmount(item), 0);
  };


  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { description: '', hsn_sac: '', unit: '', quantity: 1, purchasePrice: 0, factor: 1 },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => {
      const items = [...(prev.items || [])];
      items.splice(index, 1);
      return { ...prev, items };
    });
  };

  const validateForm = () => {
    const missingFields = [];
    if (!formData.clientId) missingFields.push('Client');
    if (!formData.contactPersonId) missingFields.push('Contact Person');
    if (!formData.endUser.trim()) missingFields.push('End User');
    if (!formData.proposalDetails.trim()) missingFields.push('Proposal Details');
    if (!(formData.items || []).length) missingFields.push('At least one item');

    const hasInvalidFactor = (formData.items || []).some((item) => !(Number(item.factor) > 0));
    if (hasInvalidFactor) {
      setError('Factor must be greater than 0 for all items');
      return false;
    }

    if (missingFields.length) {
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
      const normalizedItems = (formData.items || []).map((item) => ({
        description: item.description,
        hsn_sac: item.hsn_sac,
        unit: item.unit,
        quantity: Number(item.quantity) || 0,
        purchasePrice: Number(item.purchasePrice) || 0,
        factor: Number(item.factor) || 0,
      }));

      if (isEditMode) {
        await apiService.updateQuotation(quotationId, {
          items: normalizedItems,
        });
      } else {
        const payload = {
          Id: quotationId || undefined,
          QuotationNumber: formData.quotationNumber,
          QuotationDate: formData.quotationDate,
          clientId: formData.clientId,
          contactPersonId: formData.contactPersonId,
          endUser: formData.endUser,
          proposalDetails: formData.proposalDetails,
          status: formData.status,
          items: normalizedItems,
        };

        await apiService.createQuotation(payload);
      }

      navigate('/billing/quotations');
    } catch (saveError) {
      console.error('Error saving quotation:', saveError);
      setError(saveError.response?.data?.error || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      !formData.clientId ||
      (contact.clientId === formData.clientId || contact.ClientId === formData.clientId)
  );

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
          {isEditMode ? 'Update Quotation' : 'Create Quotation'}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/billing/quotations')}>
          Back to Quotations
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
                onChange={(_, value) => {
                  handleChange('clientId', value ? (value.Id || value.id) : '');
                  // reset contact person when client changes
                  handleChange('contactPersonId', '');
                }}
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
              <Autocomplete
                options={filteredContacts || []}
                getOptionLabel={(option) =>
                  option.name || option.Name || `Contact ${option.Id || option.id || ''}`
                }
                value={
                  (filteredContacts || []).find(
                    (c) => (c.Id || c.id)?.toString() === formData.contactPersonId?.toString()
                  ) || null
                }
                onChange={(_, value) =>
                  handleChange('contactPersonId', value ? (value.Id || value.id) : '')
                }
                disabled={loading || saving || !formData.clientId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Contact Person"
                    size="small"
                    placeholder="Select Contact"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Quotation Number"
                value={formData.quotationNumber}
                onChange={(e) => handleChange('quotationNumber', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Quotation Date"
                value={formData.quotationDate}
                onChange={(e) => handleChange('quotationDate', e.target.value)}
                disabled={loading || saving}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Status"
                value={formData.status}
                InputProps={{ readOnly: true }}
                disabled={loading || saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Revision"
                value={`${String(formData.revisionNumber || 0).padStart(2, '0')}`}
                InputProps={{ readOnly: true }}
                disabled={loading || saving}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={toggleStatus}
                disabled={loading || saving}
              >
                Toggle Status
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="End User"
                required
                value={formData.endUser}
                onChange={(e) => handleChange('endUser', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Proposal Details"
                required
                multiline
                minRows={3}
                value={formData.proposalDetails}
                onChange={(e) => handleChange('proposalDetails', e.target.value)}
                disabled={loading || saving}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Items</Typography>
                <Button size="small" startIcon={<Add />} onClick={addItem}>
                  Add Item
                </Button>
              </Box>
            </Grid>

            {formData.items.map((item, index) => (
              <Grid key={index} item xs={12}>
                <Paper sx={{ p: 2, position: 'relative' }}>
                  {formData.items.length > 1 && (
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                      onClick={() => removeItem(index)}
                      disabled={loading || saving}
                      aria-label="Remove item"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        disabled={loading || saving}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="HSN / SAC"
                        value={item.hsn_sac}
                        onChange={(e) => handleItemChange(index, 'hsn_sac', e.target.value)}
                        disabled={loading || saving}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Unit"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        disabled={loading || saving}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', Number(e.target.value))
                        }
                        disabled={loading || saving}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Purchase Price"
                        value={item.purchasePrice}
                        onChange={(e) =>
                          handleItemChange(index, 'purchasePrice', Number(e.target.value))
                        }
                        disabled={loading || saving}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Factor"
                        value={item.factor}
                        onChange={(e) => handleItemChange(index, 'factor', Number(e.target.value))}
                        disabled={loading || saving}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Rate"
                        value={roundRate(item.purchasePrice, item.factor)}
                        InputProps={{ readOnly: true }}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Amount"
                        value={calculateItemAmount(item).toFixed(2)}
                        InputProps={{ readOnly: true }}
                        disabled
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle1">
                  Total Amount: <strong>{calculateTotalAmount().toFixed(2)}</strong>
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/billing/quotations')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading || saving}>
                  {isEditMode ? 'Update Quotation' : 'Create Quotation'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
