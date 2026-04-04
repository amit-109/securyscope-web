import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Add,
  Delete,
  Download,
  Edit,
  Email,
  History,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const QUOTATION_STATUSES = ['Draft', 'Sent', 'Final', 'ConvertedToPO'];

const getQuoteId = (quote) => quote?.Id || quote?.id;
const getQuoteStatus = (quote) => quote?.Status || quote?.status || 'Draft';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatDateOnly = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
};

const formatRevision = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return String(num).padStart(2, '0');
};

const getItemRate = (item) => {
  const purchasePrice =
    item.purchasePrice ??
    item.PurchasePrice ??
    item.purchase_price ??
    item.Purchase_Price;
  const factor = item.factor ?? item.Factor;
  const legacyRate = item.rate ?? item.Rate ?? item.unitPrice ?? item.UnitPrice;

  if (Number(factor) > 0) {
    return Math.round((Number(purchasePrice) || 0) / Number(factor));
  }

  return legacyRate ?? 0;
};

const getDownloadFileName = (headers, quote, version) => {
  const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i);

  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  const quoteNumber = quote.QuotationNumber || quote.quotationNumber || `quotation-${getQuoteId(quote)}`;
  const revision =
    version?.VersionLabel ||
    version?.versionLabel ||
    formatRevision(
      version?.VersionNumber ??
      version?.versionNumber ??
      version?.RevisionNumber ??
      version?.revisionNumber ??
      0
    );

  return `${quoteNumber}-version-${revision}.pdf`;
};

const normalizePurchaseOrder = (po, index) => ({
  ...po,
  id: po.Id || po.id || `po-${index}`,
  poNumber: po.poNumber || po.PONumber || po.PoNumber || '-',
  poDate: po.poDate || po.PODate || po.PoDate || po.createdAt || po.CreatedAt || '',
  quotationId: po.quotationId || po.QuotationId || '-',
  versionId: po.versionId || po.VersionId || '-',
  createdAt: po.createdAt || po.CreatedAt || '',
});

const sanitizeCode = (value) =>
  (value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

const getApiErrorMessage = (error, fallbackMessage) => {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.message) {
    return data.message;
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(', ');
  }

  return error?.message || fallbackMessage;
};

const buildPoNumber = (quote, clientMap) => {
  const quoteId = getQuoteId(quote);
  const clientId = quote.clientId || quote.ClientId;
  const client = clientMap[clientId] || {};
  const code =
    sanitizeCode(client.initials || client.Initials) ||
    sanitizeCode(client.clientName || client.ClientName) ||
    'CLIENT';
  const year = new Date().getFullYear();
  const serial = String(quoteId || 0).padStart(3, '0');

  return `PO/${code}/${year}/${serial}`;
};

export default function BillingQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [contactPersonMap, setContactPersonMap] = useState({});
  const [clientMap, setClientMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [downloadingQuotationId, setDownloadingQuotationId] = useState(null);
  const [emailingQuotationId, setEmailingQuotationId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [viewMode, setViewMode] = useState('quotations');
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusMenuQuote, setStatusMenuQuote] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poDialogLoading, setPoDialogLoading] = useState(false);
  const [pendingPoQuote, setPendingPoQuote] = useState(null);
  const [poForm, setPoForm] = useState({
    quotationId: '',
    versionId: '',
    poNumber: '',
    poDate: '',
  });
  const navigate = useNavigate();

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [quotes, contacts, clients, purchaseOrdersData] = await Promise.all([
        apiService.getQuotations(),
        apiService.getContactPersons(),
        apiService.getClients(),
        apiService.getPurchaseOrders(),
      ]);

      const nextContactMap = (contacts || []).reduce((acc, contact) => {
        const id = contact.Id || contact.id;
        const name = contact.name || contact.Name || '';
        if (id != null) {
          acc[id] = name;
        }
        return acc;
      }, {});

      const nextClientMap = (clients || []).reduce((acc, client) => {
        const id = client.Id || client.id;
        if (id != null) {
          acc[id] = client;
        }
        return acc;
      }, {});

      setContactPersonMap(nextContactMap);
      setClientMap(nextClientMap);

      setQuotations(
        (quotes || []).map((quote, index) => ({
          id: getQuoteId(quote) || index,
          ...quote,
          contactPersonName:
            nextContactMap[quote.ContactPersonId] ||
            nextContactMap[quote.contactPersonId] ||
            '',
          clientName:
            quote.clientName ||
            quote.ClientName ||
            nextClientMap[quote.clientId || quote.ClientId]?.clientName ||
            nextClientMap[quote.clientId || quote.ClientId]?.ClientName ||
            '',
        }))
      );

      setPurchaseOrders((purchaseOrdersData || []).map(normalizePurchaseOrder));
    } catch (error) {
      console.error('Error loading billing data:', error);
      setFeedback({ type: 'error', message: 'Failed to load quotations and purchase orders.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const closeStatusMenu = () => {
    setStatusMenuAnchor(null);
    setStatusMenuQuote(null);
  };

  const openStatusMenu = (event, quote) => {
    setStatusMenuAnchor(event.currentTarget);
    setStatusMenuQuote(quote);
  };

  const handleCreate = () => {
    navigate('/billing/quotations/new');
  };

  const handleView = async (quote) => {
    try {
      const data = await apiService.getQuotationById(getQuoteId(quote));
      setSelectedQuotation(data);
      setViewDialog(true);
    } catch (error) {
      console.error('Error loading quotation:', error);
    }
  };

  const handleViewVersions = (quote) => {
    const quoteId = getQuoteId(quote);
    navigate(`/billing/quotations/${quoteId}/versions`, {
      state: {
        quotationNumber: quote.QuotationNumber || quote.quotationNumber || '-',
      },
    });
  };

  const handleDownloadCurrentQuotation = async (quote) => {
    const quoteId = getQuoteId(quote);
    setDownloadingQuotationId(quoteId);

    try {
      const response = await apiService.getQuotationVersions(quoteId);
      const versions = Array.isArray(response) ? response : response?.versions || [];
      const activeVersion =
        versions.find((version) => Number(version.IsActive ?? version.isActive ?? 0) === 1) ||
        versions[0];

      if (!activeVersion) {
        throw new Error('No quotation version found for download');
      }

      const downloadResponse = await apiService.downloadQuotationVersion(
        quoteId,
        activeVersion.Id || activeVersion.id
      );
      const blobUrl = window.URL.createObjectURL(new Blob([downloadResponse.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = getDownloadFileName(downloadResponse.headers, quote, activeVersion);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading current quotation:', error);
    } finally {
      setDownloadingQuotationId(null);
    }
  };

  const handleSendQuotationEmail = async (quote) => {
    const quoteId = getQuoteId(quote);
    const contactPersonId = quote.ContactPersonId || quote.contactPersonId;

    if (!contactPersonId) {
      window.alert('No contact person is selected for this quotation.');
      return;
    }

    setEmailingQuotationId(quoteId);

    try {
      await apiService.sendQuotationEmail(quoteId, {
        contactPersonIds: [contactPersonId],
      });
      window.alert('Quotation email sent to client successfully.');
    } catch (error) {
      console.error('Error sending quotation email:', error);
      window.alert(error.response?.data?.error || 'Failed to send quotation email.');
    } finally {
      setEmailingQuotationId(null);
    }
  };

  const handleEdit = (quote) => {
    navigate(`/billing/quotations/${getQuoteId(quote)}/edit`);
  };

  const handleDelete = async (quote) => {
    const quoteId = getQuoteId(quote);
    const confirmDelete = window.confirm('Are you sure you want to delete this quotation?');
    if (!confirmDelete) return;

    try {
      await apiService.deleteQuotation(quoteId);
      await loadBillingData();
    } catch (error) {
      console.error('Error deleting quotation:', error);
    }
  };

  const createPurchaseOrderFromQuote = async (quote) => {
    const quoteId = getQuoteId(quote);
    const versionsResponse = await apiService.getQuotationVersions(quoteId);
    const versions = Array.isArray(versionsResponse) ? versionsResponse : versionsResponse?.versions || [];
    const activeVersion =
      versions.find((version) => Number(version.IsActive ?? version.isActive ?? 0) === 1) ||
      versions[0];

    if (!activeVersion) {
      throw new Error('No active quotation version found for PO creation.');
    }

    const today = new Date().toISOString().slice(0, 10);

    return apiService.createPurchaseOrder({
      quotationId: quoteId,
      versionId: activeVersion.Id || activeVersion.id,
      poNumber: buildPoNumber(quote, clientMap),
      poDate: today,
    });
  };

  const openPoDialog = async (quote) => {
    const quoteId = getQuoteId(quote);
    setUpdatingStatusId(quoteId);
    setFeedback({ type: '', message: '' });

    try {
      const versionsResponse = await apiService.getQuotationVersions(quoteId);
      const versions = Array.isArray(versionsResponse) ? versionsResponse : versionsResponse?.versions || [];
      const activeVersion =
        versions.find((version) => Number(version.IsActive ?? version.isActive ?? 0) === 1) ||
        versions[0];

      if (!activeVersion) {
        throw new Error('No active quotation version found for PO creation.');
      }

      setPendingPoQuote(quote);
      setPoForm({
        quotationId: quoteId,
        versionId: activeVersion.Id || activeVersion.id,
        poNumber: buildPoNumber(quote, clientMap),
        poDate: new Date().toISOString().slice(0, 10),
      });
      setPoDialogOpen(true);
    } catch (error) {
      console.error('Error preparing PO dialog:', error);
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, 'Failed to prepare purchase order details.'),
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const closePoDialog = () => {
    if (poDialogLoading) return;
    setPoDialogOpen(false);
    setPendingPoQuote(null);
    setPoForm({
      quotationId: '',
      versionId: '',
      poNumber: '',
      poDate: '',
    });
  };

  const handleStatusChange = async (quote, nextStatus) => {
    const quoteId = getQuoteId(quote);
    closeStatusMenu();

    if (nextStatus === 'ConvertedToPO') {
      await openPoDialog(quote);
      return;
    }

    setUpdatingStatusId(quoteId);
    setFeedback({ type: '', message: '' });
    try {
      await apiService.updateQuotationStatus(quoteId, nextStatus);
      await loadBillingData();
      setFeedback({ type: 'success', message: `Quotation status updated to ${nextStatus}.` });
    } catch (error) {
      console.error('Error updating quotation status:', error);
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, 'Failed to update quotation status.'),
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handlePoFormChange = (field, value) => {
    setPoForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirmConvertedToPo = async () => {
    if (!pendingPoQuote) {
      return;
    }

    if (!poForm.poNumber.trim() || !poForm.poDate || !poForm.versionId) {
      setFeedback({
        type: 'error',
        message: 'PO Number, PO Date, and Version are required before conversion.',
      });
      return;
    }

    const quoteId = getQuoteId(pendingPoQuote);
    setPoDialogLoading(true);
    setUpdatingStatusId(quoteId);
    setFeedback({ type: '', message: '' });

    try {
      const poPayload = {
        quotationId: Number(poForm.quotationId) || poForm.quotationId,
        versionId: Number(poForm.versionId) || poForm.versionId,
        poNumber: poForm.poNumber.trim(),
        poDate: poForm.poDate,
      };

      await apiService.createPurchaseOrder(poPayload);
      await apiService.updateQuotationStatus(quoteId, 'ConvertedToPO');

      await loadBillingData();
      closePoDialog();
      setViewMode('purchaseOrders');
      setFeedback({ type: 'success', message: 'Quotation converted and PO created successfully.' });
    } catch (error) {
      console.error('Error converting quotation to PO:', error.response?.data || error);
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, 'Failed to convert quotation to purchase order.'),
      });
    } finally {
      setPoDialogLoading(false);
      setUpdatingStatusId(null);
    }
  };

  const quotationColumns = [
    { field: 'Id', headerName: 'ID', width: 90 },
    {
      field: 'QuotationNumber',
      headerName: 'Quotation #',
      width: 190,
      valueGetter: (params) =>
        params.row.QuotationNumber || params.row.quotationNumber || '-',
    },
    {
      field: 'QuotationDate',
      headerName: 'Date',
      width: 130,
      valueGetter: (params) =>
        params.row.QuotationDate || params.row.quotationDate || '-',
    },
    {
      field: 'Status',
      headerName: 'Status',
      width: 180,
      sortable: false,
      renderCell: (params) => {
        const currentStatus = getQuoteStatus(params.row);
        const availableStatuses = QUOTATION_STATUSES.filter((status) => status !== currentStatus);
        const isBusy = updatingStatusId === getQuoteId(params.row);

        return (
          <>
            <Button
              variant="outlined"
              size="small"
              onClick={(event) => openStatusMenu(event, params.row)}
              disabled={isBusy}
              sx={{ textTransform: 'none' }}
            >
              {currentStatus}
            </Button>
            {statusMenuQuote && getQuoteId(statusMenuQuote) === getQuoteId(params.row) ? (
              <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={closeStatusMenu}
              >
                {availableStatuses.map((status) => (
                  <MenuItem
                    key={status}
                    onClick={() => handleStatusChange(params.row, status)}
                  >
                    {status}
                  </MenuItem>
                ))}
              </Menu>
            ) : null}
          </>
        );
      },
    },
    {
      field: 'clientId',
      headerName: 'Client',
      width: 180,
      valueGetter: (params) =>
        params.row.clientName ||
        params.row.ClientName ||
        params.row.clientId ||
        params.row.ClientId ||
        '-',
    },
    {
      field: 'contactPersonId',
      headerName: 'Contact Person',
      width: 200,
      valueGetter: (params) =>
        params.row.contactPersonName ||
        params.row.ContactPersonName ||
        (params.row.ContactPersonId != null ? contactPersonMap[params.row.ContactPersonId] : null) ||
        (params.row.contactPersonId != null ? contactPersonMap[params.row.contactPersonId] : null) ||
        params.row.contactPersonId ||
        params.row.ContactPersonId ||
        '-',
    },
    {
      field: 'EndUser',
      headerName: 'End User',
      width: 180,
      valueGetter: (params) => params.row.EndUser || params.row.endUser || '-',
    },
    {
      field: 'ProposalDetails',
      headerName: 'Proposal',
      width: 260,
      valueGetter: (params) => params.row.ProposalDetails || params.row.proposalDetails || '-',
      renderCell: (params) => (
        <Typography variant="body2" noWrap title={params.value}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'CreatedAt',
      headerName: 'Created At',
      width: 170,
      valueGetter: (params) => params.row.CreatedAt || params.row.createdAt || '',
      valueFormatter: (params) => formatDateTime(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 270,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleView(params.row)} size="small" title="View">
            <Visibility />
          </IconButton>
          <IconButton
            onClick={() => handleSendQuotationEmail(params.row)}
            size="small"
            title="Send Email To Client"
            disabled={emailingQuotationId === getQuoteId(params.row)}
          >
            <Email />
          </IconButton>
          <IconButton
            onClick={() => handleDownloadCurrentQuotation(params.row)}
            size="small"
            title="Download Current Quotation"
            disabled={downloadingQuotationId === getQuoteId(params.row)}
          >
            <Download />
          </IconButton>
          <IconButton onClick={() => handleViewVersions(params.row)} size="small" title="View Versions">
            <History />
          </IconButton>
          <IconButton onClick={() => handleEdit(params.row)} size="small" title="Edit">
            <Edit />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row)} size="small" color="error" title="Delete">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  const purchaseOrderColumns = [
    {
      field: 'poNumber',
      headerName: 'PO #',
      width: 220,
      valueGetter: (params) => params.row.poNumber || '-',
    },
    {
      field: 'poDate',
      headerName: 'PO Date',
      width: 140,
      valueGetter: (params) => params.row.poDate || '',
      valueFormatter: (params) => formatDateOnly(params.value),
    },
    {
      field: 'quotationId',
      headerName: 'Quotation ID',
      width: 130,
      valueGetter: (params) => params.row.quotationId || '-',
    },
    {
      field: 'versionId',
      headerName: 'Version ID',
      width: 130,
      valueGetter: (params) => params.row.versionId || '-',
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      valueGetter: (params) => params.row.createdAt || '',
      valueFormatter: (params) => formatDateTime(params.value),
    },
  ];

  const renderQuotationDetails = (quote) => {
    if (!quote) return null;

    return (
      <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
        <Box>
          <strong>ID:</strong> {getQuoteId(quote)}
        </Box>
        <Box>
          <strong>Client:</strong> {quote.clientName || quote.ClientName || quote.clientId || quote.ClientId}
        </Box>
        <Box>
          <strong>Contact Person:</strong>{' '}
          {quote.contactPersonName ||
            quote.ContactPersonName ||
            (quote.ContactPersonId != null ? contactPersonMap[quote.ContactPersonId] : null) ||
            (quote.contactPersonId != null ? contactPersonMap[quote.contactPersonId] : null) ||
            quote.contactPersonId ||
            quote.ContactPersonId ||
            '-'}
        </Box>
        <Box>
          <strong>Revision:</strong> {formatRevision(quote.RevisionNumber ?? quote.revisionNumber)}
        </Box>
        <Box>
          <strong>Status:</strong> {getQuoteStatus(quote)}
        </Box>
        <Box>
          <strong>End User:</strong> {quote.EndUser || quote.endUser || '-'}
        </Box>
        <Box>
          <strong>Proposal Details:</strong> {quote.ProposalDetails || quote.proposalDetails || '-'}
        </Box>
        <Box>
          <strong>Items:</strong>{' '}
          {Array.isArray(quote.items) && quote.items.length > 0 ? (
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              {quote.items.map((item, idx) => (
                <li key={idx}>
                  <strong>
                    {item.description ||
                      item.Description ||
                      item.productDescription ||
                      item.ProductDescription ||
                      'Item'}
                  </strong>{' '}
                  - {item.quantity ?? item.Quantity} x {getItemRate(item)} ({item.unit || item.Unit || '-'})
                </li>
              ))}
            </ol>
          ) : (
            '-'
          )}
        </Box>
      </Box>
    );
  };

  const selectedQuotationNumber =
    pendingPoQuote?.QuotationNumber || pendingPoQuote?.quotationNumber || '-';

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
        <Box>
          <Typography variant="h4">Billing Documents</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage quotations, update quotation status, and review created purchase orders.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <ButtonGroup variant="outlined">
            <Button
              variant={viewMode === 'quotations' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('quotations')}
            >
              Quotation List
            </Button>
            <Button
              variant={viewMode === 'purchaseOrders' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('purchaseOrders')}
            >
              PO List
            </Button>
          </ButtonGroup>
          {viewMode === 'quotations' ? (
            <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
              Create Quotation
            </Button>
          ) : null}
        </Box>
      </Box>

      {feedback.message ? (
        <Alert severity={feedback.type || 'info'} sx={{ mb: 2 }} onClose={() => setFeedback({ type: '', message: '' })}>
          {feedback.message}
        </Alert>
      ) : null}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={viewMode === 'quotations' ? quotations : purchaseOrders}
          columns={viewMode === 'quotations' ? quotationColumns : purchaseOrderColumns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true } }}
        />
      </Paper>

      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Quotation Details</DialogTitle>
        <DialogContent>{renderQuotationDetails(selectedQuotation)}</DialogContent>
        <DialogActions>
          <Button
            startIcon={<Email />}
            onClick={() => handleSendQuotationEmail(selectedQuotation)}
            disabled={
              !selectedQuotation ||
              emailingQuotationId === getQuoteId(selectedQuotation)
            }
          >
            Send Email
          </Button>
          <Button
            startIcon={<Download />}
            onClick={() => handleDownloadCurrentQuotation(selectedQuotation)}
            disabled={
              !selectedQuotation ||
              downloadingQuotationId === getQuoteId(selectedQuotation)
            }
          >
            Download Current
          </Button>
          <Button
            startIcon={<History />}
            onClick={() => {
              setViewDialog(false);
              handleViewVersions(selectedQuotation);
            }}
          >
            View Versions
          </Button>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={poDialogOpen} onClose={closePoDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'grid', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Quotation #{selectedQuotationNumber}
            </Typography>
            <TextField
              label="Quotation ID"
              size="small"
              value={poForm.quotationId}
              InputProps={{ readOnly: true }}
              disabled={poDialogLoading}
            />
            <TextField
              label="Version ID"
              size="small"
              value={poForm.versionId}
              InputProps={{ readOnly: true }}
              disabled={poDialogLoading}
            />
            <TextField
              label="PO Number"
              size="small"
              value={poForm.poNumber}
              onChange={(event) => handlePoFormChange('poNumber', event.target.value)}
              disabled={poDialogLoading}
              required
            />
            <TextField
              label="PO Date"
              type="date"
              size="small"
              value={poForm.poDate}
              onChange={(event) => handlePoFormChange('poDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={poDialogLoading}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePoDialog} disabled={poDialogLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmConvertedToPo}
            disabled={poDialogLoading}
          >
            Create PO
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
