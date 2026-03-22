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
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Add, Delete, Download, Edit, Visibility, History, Email } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

export default function BillingQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [contactPersonMap, setContactPersonMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [downloadingQuotationId, setDownloadingQuotationId] = useState(null);
  const [emailingQuotationId, setEmailingQuotationId] = useState(null);
  const navigate = useNavigate();

  const statuses = ['Draft', 'Sent', 'Final', 'ConvertedToPO'];

  const toggleQuoteStatus = async (quote) => {
    const current = quote.Status || quote.status || 'Draft';
    const nextIndex = (statuses.indexOf(current) + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    try {
      await apiService.updateQuotation(quote.Id || quote.id, { status: nextStatus });
      loadQuotations();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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

    const quoteNumber = quote.QuotationNumber || quote.quotationNumber || `quotation-${quote.Id || quote.id}`;
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

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const [quotes, contacts] = await Promise.all([
        apiService.getQuotations(),
        apiService.getContactPersons(),
      ]);

      const contactMap = (contacts || []).reduce((acc, contact) => {
        const id = contact.Id || contact.id;
        const name = contact.name || contact.Name || '';
        if (id != null) {
          acc[id] = name;
        }
        return acc;
      }, {});

      setContactPersonMap(contactMap);

      setQuotations((quotes || []).map((quote, index) => ({
        id: quote.Id || quote.id || index,
        ...quote,
        contactPersonName:
          contactMap[quote.ContactPersonId] || contactMap[quote.contactPersonId] || '',
      })));
    } catch (error) {
      console.error('Error loading quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleCreate = () => {
    navigate('/billing/quotations/new');
  };

  const handleView = async (quote) => {
    try {
      const data = await apiService.getQuotationById(quote.Id || quote.id);
      setSelectedQuotation(data);
      setViewDialog(true);
    } catch (error) {
      console.error('Error loading quotation:', error);
    }
  };

  const handleViewVersions = (quote) => {
    const quoteId = quote.Id || quote.id;
    navigate(`/billing/quotations/${quoteId}/versions`, {
      state: {
        quotationNumber: quote.QuotationNumber || quote.quotationNumber || '-',
      },
    });
  };

  const handleDownloadCurrentQuotation = async (quote) => {
    const quoteId = quote.Id || quote.id;
    setDownloadingQuotationId(quoteId);

    try {
      const response = await apiService.getQuotationVersions(quoteId);
      const versions = Array.isArray(response) ? response : (response?.versions || []);
      const activeVersion =
        versions.find((version) => Number(version.IsActive ?? version.isActive ?? 0) === 1) ||
        versions[0];

      if (!activeVersion) {
        throw new Error('No quotation version found for download');
      }

      const downloadResponse = await apiService.downloadQuotationVersion(quoteId, activeVersion.Id || activeVersion.id);
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
    const quoteId = quote.Id || quote.id;
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
    navigate(`/billing/quotations/${quote.Id || quote.id}/edit`);
  };

  const handleDelete = async (quote) => {
    const quoteId = quote.Id || quote.id;
    const confirm = window.confirm('Are you sure you want to delete this quotation?');
    if (!confirm) return;

    try {
      await apiService.deleteQuotation(quoteId);
      loadQuotations();
    } catch (error) {
      console.error('Error deleting quotation:', error);
    }
  };

  const columns = [
    { field: 'Id', headerName: 'ID', width: 100 },
    {
      field: 'QuotationNumber',
      headerName: 'Quotation #',
      width: 200,
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
      width: 120,
      valueGetter: (params) => params.row.Status || params.row.status || '-',
    },
    {
      field: 'clientId',
      headerName: 'Client',
      width: 180,
      valueGetter: (params) => params.row.clientName || params.row.ClientName || params.row.clientId || params.row.ClientId || '-',
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
    // {
    //   field: 'items',
    //   headerName: 'Items',
    //   width: 100,
    //   sortable: false,
    //   valueGetter: (params) => (Array.isArray(params.value) ? params.value.length : 0),
    // },
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
            disabled={emailingQuotationId === (params.row.Id || params.row.id)}
          >
            <Email />
          </IconButton>
          <IconButton
            onClick={() => handleDownloadCurrentQuotation(params.row)}
            size="small"
            title="Download Current Quotation"
            disabled={downloadingQuotationId === (params.row.Id || params.row.id)}
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

  const renderQuotationDetails = (quote) => {
    if (!quote) return null;

    return (
      <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
        <Box>
          <strong>ID:</strong> {quote.Id || quote.id}
        </Box>
        <Box>
          <strong>Client:</strong> {quote.clientName || quote.ClientName || quote.clientId || quote.ClientId}
        </Box>
        <Box>
          <strong>Contact Person:</strong>{' '}
          {quote.contactPersonName || quote.ContactPersonName ||
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
                  <strong>{
                    item.description ||
                    item.Description ||
                    item.productDescription ||
                    item.ProductDescription ||
                    'Item'
                  }</strong>{' '}-{' '}
                  {item.quantity ?? item.Quantity} x {getItemRate(item)} ({item.unit || item.Unit || '-'})
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
        <Typography variant="h4">Quotations</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
          Create Quotation
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={quotations}
          columns={columns}
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
              emailingQuotationId === (selectedQuotation?.Id || selectedQuotation?.id)
            }
          >
            Send Email
          </Button>
          <Button
            startIcon={<Download />}
            onClick={() => handleDownloadCurrentQuotation(selectedQuotation)}
            disabled={
              !selectedQuotation ||
              downloadingQuotationId === (selectedQuotation?.Id || selectedQuotation?.id)
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

    </Box>
  );
}
