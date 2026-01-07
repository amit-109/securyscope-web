import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Fab,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Visibility, Edit, Delete, ExitToApp } from '@mui/icons-material';
import apiService from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewDialog, setViewDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.Email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(user => user.RoleName === roleFilter);
    }

    if (statusFilter) {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.IsActive === isActive);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      const processedUsers = data.map((user, index) => ({
        id: user.Id || user.id || index,
        ...user,
      }));
      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await apiService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setViewDialog(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    
    // Find role ID based on role name
    const userRole = roles.find(role => role.RoleName === user.RoleName);
    
    setEditData({
      name: user.Name,
      email: user.Email,
      role: userRole ? userRole.Id : '',
    });
    setError('');
    setEditDialog(true);
  };

  const handleCreate = () => {
    setFormData({ name: '', email: '', password: '', role: '' });
    setError('');
    setCreateDialog(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('All fields are required');
      return;
    }



    try {
      await apiService.createUser(formData);
      setCreateDialog(false);
      loadUsers();
      setFormData({ name: '', email: '', password: '', role: '' });
      setError('');
    } catch (error) {
      setError(error.response?.data?.error );
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.name || !editData.email || !editData.role) {
      setError('All fields are required');
      return;
    }

    try {
      await apiService.updateUser(selectedUser.Id, editData);
      setEditDialog(false);
      loadUsers();
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleForceLogout = async (user) => {
    if (window.confirm(`Force logout user "${user.Name}"? This will end their current session if they are logged in.`)) {
      try {
        await apiService.forceLogoutUser(user.Id);
        console.log(`User ${user.Name} logout command sent successfully`);
      } catch (error) {
        console.error('Error forcing logout:', error);
      }
    }
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.Name}"?`)) {
      try {
        await apiService.deleteUser(user.Id);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const columns = [
    { field: 'Id', headerName: 'ID', width: 70 },
    { field: 'Name', headerName: 'Name', width: 200 },
    { field: 'Email', headerName: 'Email', width: 250 },
    {
      field: 'RoleName',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'No Role'}
          color={params.value === 'Administrator' ? 'error' : 'primary'}
          size="small"
        />
      ),
    },
    {
      field: 'IsActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'LoginStatus',
      headerName: 'Login Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Online' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'CreatedAt',
      headerName: 'Created Date',
      width: 180,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleView(params.row)} size="small">
            <Visibility />
          </IconButton>
          <IconButton onClick={() => handleEdit(params.row)} size="small">
            <Edit />
          </IconButton>
          <IconButton onClick={() => handleForceLogout(params.row)} size="small" color="warning">
            <ExitToApp />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row)} size="small" color="error">
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users Management
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Search users..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 250 }}
        />
        <TextField
          select
          label="Filter by Role"
          variant="outlined"
          size="small"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Roles</MenuItem>
          <MenuItem value="Administrator">Administrator</MenuItem>
          <MenuItem value="Employee">Employee</MenuItem>
        </TextField>
        <TextField
          select
          label="Filter by Status"
          variant="outlined"
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
        <Button 
          variant="outlined" 
          onClick={() => {
            setSearchTerm('');
            setRoleFilter('');
            setStatusFilter('');
          }}
        >
          Clear Filters
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredUsers}
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

      {/* View User Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom><strong>ID:</strong> {selectedUser.Id}</Typography>
              <Typography gutterBottom><strong>Name:</strong> {selectedUser.Name}</Typography>
              <Typography gutterBottom><strong>Email:</strong> {selectedUser.Email}</Typography>
              <Typography gutterBottom><strong>Role:</strong> {selectedUser.RoleName}</Typography>
              <Typography gutterBottom>
                <strong>Status:</strong> 
                <Chip 
                  label={selectedUser.IsActive ? 'Active' : 'Inactive'} 
                  color={selectedUser.IsActive ? 'success' : 'default'} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography gutterBottom>
                <strong>Created:</strong> {new Date(selectedUser.CreatedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            margin="normal"
            required
            helperText="Password must be at least 8 characters long"
          />
          <TextField
            fullWidth
            select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            margin="normal"
            required
          >
            {roles.map((role) => (
              <MenuItem key={`role-${role.Id}`} value={role.Id}>
                {role.RoleName}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Full Name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Role"
            value={editData.role}
            onChange={(e) => setEditData({ ...editData, role: e.target.value })}
            margin="normal"
            required
          >
            {roles.map((role) => (
              <MenuItem key={`edit-role-${role.Id}`} value={role.Id}>
                {role.RoleName}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Update User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
