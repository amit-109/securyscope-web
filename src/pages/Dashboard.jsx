import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  People,
  AccessTime,
  EventNote,
  TrendingUp,
} from '@mui/icons-material';
import apiService from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
    totalLeaves: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [attendance, leaves, users] = await Promise.all([
        apiService.getAllAttendance(),
        apiService.getAllLeaves(),
        apiService.getUsers(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(record => 
        record.CreatedAt?.startsWith(today)
      ).length;

      const pendingLeaves = leaves.filter(leave => 
        leave.status === 'pending'
      ).length;

      setStats({
        totalUsers: users.length,
        todayAttendance,
        pendingLeaves,
        totalLeaves: leaves.length,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {loading ? <CircularProgress size={24} /> : value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to SecuryScope Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People sx={{ color: 'white' }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Attendance"
            value={stats.todayAttendance}
            icon={<AccessTime sx={{ color: 'white' }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            icon={<EventNote sx={{ color: 'white' }} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Leaves"
            value={stats.totalLeaves}
            icon={<TrendingUp sx={{ color: 'white' }} />}
            color="info.main"
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              System overview and recent activities will be displayed here.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}