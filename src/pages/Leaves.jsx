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
  MenuItem,
  Chip,
  Fab,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Delete, Add, Visibility, CheckCircle, Cancel } from '@mui/icons-material';
import apiService from '../services/api';

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newLeave, setNewLeave] = useState({
    date_from: '',
    date_to: '',
    leave_type_id: '',
    leave_reason: ''
  });

  useEffect(() => {
    loadLeaves();
    loadLeaveTypes();
  }, []);

  const loadLeaves = async () => {
    try {
      const data = await apiService.getAllLeaves();
      setLeaves(data.map(leave => ({
        id: leave.Id,
        employeeName: leave.Name,
        leaveType: leave.LeaveType,
        dateFrom: leave.DateFrom,
        dateTo: leave.DateTo,
        reason: leave.LeaveReason,
        status: leave.ApprovalStatus,
        createdAt: leave.DateCreated,
        userId: leave.UserId,
        leaveTypeId: leave.LeaveTypeId
      })));
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const data = await apiService.getLeaveTypes();
      setLeaveTypes(data);
    } catch (error) {
      console.error('Error loading leave types:', error);
    }
  };

  const handleView = (leave) => {
    setSelectedLeave(leave);
    setViewDialog(true);
  };

  const handleStatusChange = (leave) => {
    setSelectedLeave(leave);
    setNewStatus(leave.status);
    setStatusDialog(true);
  };

  const handleQuickStatusUpdate = async (leaveId, newStatus) => {
    try {
      await apiService.updateLeaveStatus(leaveId, newStatus);
      loadLeaves();
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  const handleQuickApprove = async (leave) => {
    if (window.confirm(`Approve leave for ${leave.employeeName}?`)) {
      try {
        await apiService.updateLeaveStatus(leave.id, 'Approved');
        loadLeaves();
      } catch (error) {
        console.error('Error approving leave:', error);
      }
    }
  };

  const handleQuickReject = async (leave) => {
    if (window.confirm(`Reject leave for ${leave.employeeName}?`)) {
      try {
        await apiService.updateLeaveStatus(leave.id, 'Rejected');
        loadLeaves();
      } catch (error) {
        console.error('Error rejecting leave:', error);
      }
    }
  };

  const handleSaveStatus = async () => {
    try {
      await apiService.updateLeaveStatus(selectedLeave.id, newStatus);
      setStatusDialog(false);
      loadLeaves();
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  const handleCreate = () => {
    setNewLeave({
      date_from: '',
      date_to: '',
      leave_type_id: '',
      leave_reason: ''
    });
    setCreateDialog(true);
  };

  const handleSaveCreate = async () => {
    try {
      await apiService.createLeave(newLeave);
      setCreateDialog(false);
      loadLeaves();
    } catch (error) {
      console.error('Error creating leave:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await apiService.deleteLeave(id);
        loadLeaves();
      } catch (error) {
        console.error('Error deleting leave:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'applied': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'employeeName', headerName: 'Employee', width: 150 },
    { field: 'leaveType', headerName: 'Leave Type', width: 120 },
    { field: 'dateFrom', headerName: 'From Date', width: 120 },
    { field: 'dateTo', headerName: 'To Date', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        const handleStatusClick = (newStatus) => {
          if (newStatus !== params.value) {
            handleQuickStatusUpdate(params.row.id, newStatus);
          }
        };

        return (
          <TextField
            select
            size="small"
            value={params.value}
            onChange={(e) => handleStatusClick(e.target.value)}
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="Applied">
              <Chip label="Applied" color="warning" size="small" />
            </MenuItem>
            <MenuItem value="Approved">
              <Chip label="Approved" color="success" size="small" />
            </MenuItem>
            <MenuItem value="Rejected">
              <Chip label="Rejected" color="error" size="small" />
            </MenuItem>
          </TextField>
        );
      },
    },
    { field: 'reason', headerName: 'Reason', width: 200 },
    {
      field: 'createdAt',
      headerName: 'Applied Date',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton onClick={() => handleView(params.row)} size="small">
              <Visibility />
            </IconButton>
          </Tooltip>
          
          {params.row.status === 'Applied' && (
            <>
              <Tooltip title="Quick Approve">
                <IconButton onClick={() => handleQuickApprove(params.row)} size="small" color="success">
                  <CheckCircle />
                </IconButton>
              </Tooltip>
              <Tooltip title="Quick Reject">
                <IconButton onClick={() => handleQuickReject(params.row)} size="small" color="error">
                  <Cancel />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          <Tooltip title="Edit Status">
            <IconButton onClick={() => handleStatusChange(params.row)} size="small">
              <Edit />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(params.row.id)} size="small" color="error">
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Leave Management
      </Typography>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={leaves}
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
        <DialogTitle>Leave Details</DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom><strong>Employee:</strong> {selectedLeave.employeeName}</Typography>
              <Typography gutterBottom><strong>Leave Type:</strong> {selectedLeave.leaveType}</Typography>
              <Typography gutterBottom><strong>From:</strong> {selectedLeave.dateFrom}</Typography>
              <Typography gutterBottom><strong>To:</strong> {selectedLeave.dateTo}</Typography>
              <Typography gutterBottom><strong>Status:</strong> 
                <Chip 
                  label={selectedLeave.status} 
                  color={getStatusColor(selectedLeave.status)} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography gutterBottom><strong>Reason:</strong> {selectedLeave.reason}</Typography>
              <Typography gutterBottom><strong>Applied:</strong> {new Date(selectedLeave.createdAt).toLocaleDateString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedLeave?.status === 'Applied' && (
            <>
              <Button onClick={() => handleQuickApprove(selectedLeave)} color="success" variant="contained">
                Approve
              </Button>
              <Button onClick={() => handleQuickReject(selectedLeave)} color="error" variant="contained">
                Reject
              </Button>
            </>
          )}
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Leave Request</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              value={newLeave.date_from}
              onChange={(e) => setNewLeave({...newLeave, date_from: e.target.value})}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="date"
              label="To Date"
              value={newLeave.date_to}
              onChange={(e) => setNewLeave({...newLeave, date_to: e.target.value})}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              select
              label="Leave Type"
              value={newLeave.leave_type_id}
              onChange={(e) => setNewLeave({...newLeave, leave_type_id: e.target.value})}
              margin="normal"
            >
              {leaveTypes.filter(type => type.IsActive === 1).map((type) => (
                <MenuItem key={type.Id} value={type.Id}>
                  {type.LeaveType}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason"
              value={newLeave.leave_reason}
              onChange={(e) => setNewLeave({...newLeave, leave_reason: e.target.value})}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Leave Status</DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom><strong>Employee:</strong> {selectedLeave.employeeName}</Typography>
              <Typography gutterBottom><strong>Leave Type:</strong> {selectedLeave.leaveType}</Typography>
              <Typography gutterBottom><strong>Duration:</strong> {selectedLeave.dateFrom} to {selectedLeave.dateTo}</Typography>
              <Typography gutterBottom><strong>Reason:</strong> {selectedLeave.reason}</Typography>
              
              <TextField
                fullWidth
                select
                label="Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                margin="normal"
              >
                <MenuItem value="Applied">Applied</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveStatus} variant="contained">Update Status</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}