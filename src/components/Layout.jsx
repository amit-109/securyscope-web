import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Collapse,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  AccessTime,
  EventNote,
  Settings,
  AccountCircle,
  Logout,
  Category,
  CalendarMonth,
  ReceiptLong,
  Business,
  Badge,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import DashboardPage from '../pages/Dashboard';
import AttendancePage from '../pages/Attendance';
import LeavesPage from '../pages/Leaves';
import LeaveTypesPage from '../pages/LeaveTypes';
import UsersPage from '../pages/Users';
import RolesPage from '../pages/Roles';
import ProfilePage from '../pages/ProfileScreen';
import HolidayMasterPage from '../pages/HolidayMaster';
import BillingClientsPage from '../pages/BillingClients';
import BillingClientFormPage from '../pages/BillingClientForm';
import BillingContactPersonsPage from '../pages/BillingContactPersons';
import BillingContactPersonFormPage from '../pages/BillingContactPersonForm';
import StateMasterPage from '../pages/StateMaster';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  {
    text: 'User',
    icon: <People />,
    children: [
      { text: 'Users', icon: <Badge />, path: '/users' },
      { text: 'Attendance', icon: <AccessTime />, path: '/attendance' },
      { text: 'Roles', icon: <Settings />, path: '/roles' },
      { text: 'Profile', icon: <AccountCircle />, path: '/profile' },
    ],
  },
  {
    text: 'Leave',
    icon: <EventNote />,
    children: [
      { text: 'Leaves', icon: <EventNote />, path: '/leaves' },
      { text: 'Leave Types', icon: <Category />, path: '/leave-types' },
      { text: 'Holiday Master', icon: <CalendarMonth />, path: '/holiday-master' },
    ],
  },
  {
    text: 'Billing',
    icon: <ReceiptLong />,
    children: [
      { text: 'Client', icon: <Business />, path: '/billing/client' },
      { text: 'Contact Persons', icon: <People />, path: '/billing/contacts' },
      { text: 'State Master', icon: <Badge />, path: '/billing/states' },
    ],
  },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [openMenus, setOpenMenus] = useState(() =>
    menuItems.reduce((acc, item) => {
      if (item.children) {
        acc[item.text] = item.children.some((child) => child.path === window.location.pathname);
      }
      return acc;
    }, {})
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuToggle = (menuKey) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const navigateTo = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img
            src="/SE_Logo_with_name.png"
            alt="SecuryScope Logo"
            style={{ height: '32px', width: 'auto' }}
          />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <Box key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                selected={
                  item.path === location.pathname ||
                  item.children?.some((child) => child.path === location.pathname)
                }
                onClick={() => (
                  item.children ? handleMenuToggle(item.text) : navigateTo(item.path)
                )}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {item.children ? (
                  openMenus[item.text] ? <ExpandLess /> : <ExpandMore />
                ) : null}
              </ListItemButton>
            </ListItem>

            {item.children ? (
              <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItem key={child.text} disablePadding>
                      <ListItemButton
                        selected={location.pathname === child.path}
                        onClick={() => navigateTo(child.path)}
                        sx={{
                          pl: 5,
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(25, 118, 210, 0.12)',
                            color: 'primary.main',
                            '& .MuiListItemIcon-root': {
                              color: 'primary.main',
                            },
                          },
                        }}
                      >
                        <ListItemIcon>{child.icon}</ListItemIcon>
                        <ListItemText primary={child.text} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            ) : null}
          </Box>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            {/* <img
              src="/SE_Logo_with_name.png"
              alt="SecuryScope Logo"
              style={{ height: '28px', width: 'auto', filter: 'brightness(0) invert(1)' }}
            /> */}
            <Typography variant="h6" noWrap component="div">
              Admin Dashboard
            </Typography>
          </Box>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              {user?.name || 'Admin'}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/leave-types" element={<LeaveTypesPage />} />
          <Route path="/holiday-master" element={<HolidayMasterPage />} />
          <Route path="/billing/client" element={<BillingClientsPage />} />
          <Route path="/billing/client/new" element={<BillingClientFormPage />} />
          <Route path="/billing/client/:clientId/edit" element={<BillingClientFormPage />} />
          <Route path="/billing/contacts" element={<BillingContactPersonsPage />} />
          <Route path="/billing/contacts/new" element={<BillingContactPersonFormPage />} />
          <Route path="/billing/contacts/:contactId/edit" element={<BillingContactPersonFormPage />} />
          <Route path="/billing/states" element={<StateMasterPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </Box>
    </Box>
  );
}
