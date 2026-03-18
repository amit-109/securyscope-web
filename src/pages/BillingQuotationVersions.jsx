import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Paper, Typography } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ArrowBack, Download } from '@mui/icons-material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return num.toFixed(2);
};

const formatRevision = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return String(num).padStart(2, '0');
};

const normalizeVersion = (version, index) => ({
  ...version,
  id: version.Id || version.id || `${version.VersionNumber ?? version.versionNumber ?? index}`,
  versionNumber:
    version.VersionNumber ??
    version.versionNumber ??
    version.RevisionNumber ??
    version.revisionNumber ??
    index,
  versionLabel:
    version.VersionLabel ??
    version.versionLabel ??
    formatRevision(
      version.VersionNumber ??
      version.versionNumber ??
      version.RevisionNumber ??
      version.revisionNumber
    ),
  isActive: Number(version.IsActive ?? version.isActive ?? 0),
  totalAmount: version.TotalAmount ?? version.totalAmount,
  createdAt: version.CreatedAt ?? version.createdAt,
});

export default function BillingQuotationVersions() {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [quotationInfo, setQuotationInfo] = useState({
    quotationId,
    quotationNumber: location.state?.quotationNumber || '-',
  });

  const getDownloadFileName = (headers, version) => {
    const disposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
    const match = disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i);

    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }

    const quoteNumber = quotationInfo.quotationNumber !== '-' ? quotationInfo.quotationNumber : `quotation-${quotationId}`;
    return `${quoteNumber}-version-${version.versionLabel || version.id}.pdf`;
  };

  const handleDownload = async (version) => {
    setDownloadingId(version.id);
    try {
      const response = await apiService.downloadQuotationVersion(quotationId, version.id);
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = getDownloadFileName(response.headers, version);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading quotation version:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      try {
        const response = await apiService.getQuotationVersions(quotationId);
        const rawVersions = Array.isArray(response) ? response : (response?.versions || []);
        const normalizedVersions = rawVersions
          .map(normalizeVersion)
          .filter((version) => version.isActive === 0);

        setVersions(normalizedVersions);
        setQuotationInfo({
          quotationId: response?.quotationId || quotationId,
          quotationNumber:
            response?.quotationNumber ||
            location.state?.quotationNumber ||
            '-',
        });
      } catch (error) {
        console.error('Error loading quotation versions:', error);
        setVersions([]);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [location.state?.quotationNumber, quotationId]);

  const columns = [
    {
      field: 'versionLabel',
      headerName: 'Version',
      width: 140,
      valueGetter: (params) => params.row.versionLabel || '-',
    },
    {
      field: 'versionNumber',
      headerName: 'Version Number',
      width: 160,
      valueGetter: (params) => params.row.versionNumber ?? '-',
    },
    {
      field: 'isActive',
      headerName: 'Is Active',
      width: 130,
      valueGetter: (params) => (Number(params.row.isActive) === 1 ? 'Yes' : 'No'),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 220,
      valueGetter: (params) => params.row.createdAt || '',
      valueFormatter: (params) => formatDateTime(params.value),
    },
    {
      field: 'totalAmount',
      headerName: 'Total Amount',
      width: 160,
      valueGetter: (params) => params.row.totalAmount,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: 'actions',
      headerName: 'Download',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          title="Download quotation"
          onClick={() => handleDownload(params.row)}
          disabled={downloadingId === params.row.id}
        >
          <Download />
        </IconButton>
      ),
    },
  ];

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
          <Typography variant="h4">Quotation Version History</Typography>
          <Typography variant="body2" color="text.secondary">
            Quotation ID: {quotationInfo.quotationId} | Quotation Number: {quotationInfo.quotationNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Showing only previous versions where `IsActive = 0`
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/billing/quotations')}
        >
          Back to Quotations
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={versions}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          disableSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true } }}
        />
      </Paper>
    </Box>
  );
}
