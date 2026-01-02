# SecuryScope Admin Web Interface

A modern, responsive admin dashboard built with React, Vite, and Material-UI for managing the SecuryScope attendance system.

## Features

- **Modern UI**: Clean, professional interface using Material-UI components
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Authentication**: Secure login system with JWT token management
- **Dashboard**: Overview with key metrics and statistics
- **Attendance Management**: View, edit, and delete attendance records
- **Leave Management**: Approve/reject leave requests and manage leave types
- **User Management**: View user information and roles
- **Role Management**: Create and manage user roles

## Tech Stack

- **Frontend**: React 18 + Vite
- **UI Library**: Material-UI (MUI) v5
- **Data Grid**: MUI X Data Grid
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context API

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## API Integration

The application is configured to work with the SecuryScope backend API at `https://api.securyscope.com/api`.

### Available Endpoints:
- `POST /login` - Admin authentication
- `GET /attendance` - Get all attendance records
- `PUT /attendance/{id}` - Update attendance record
- `DELETE /attendance/{id}` - Delete attendance record
- `GET /leaves` - Get all leave requests
- `PUT /leaves/{id}/status` - Update leave status
- `GET /leave-types` - Get leave types
- `POST /leave-types` - Create leave type
- `GET /users` - Get all users
- `GET /roles` - Get all roles

## Project Structure

```
src/
├── components/
│   └── Layout.jsx          # Main layout with sidebar and navbar
├── contexts/
│   └── AuthContext.jsx     # Authentication context
├── pages/
│   ├── Login.jsx           # Login page
│   ├── Dashboard.jsx       # Dashboard with statistics
│   ├── Attendance.jsx      # Attendance management
│   ├── Leaves.jsx          # Leave management
│   ├── LeaveTypes.jsx      # Leave types management
│   ├── Users.jsx           # User management
│   └── Roles.jsx           # Role management
├── services/
│   └── api.js              # API service layer
├── App.jsx                 # Main app component
├── main.jsx                # Entry point
└── index.css               # Global styles
```

## Key Features

### Dashboard
- Real-time statistics cards
- Total users, today's attendance, pending leaves
- Clean overview of system status

### Attendance Management
- Data grid with sorting and pagination
- View attendance photos
- Edit location and direction
- Delete records with confirmation

### Leave Management
- Approve/reject leave requests
- View leave details and reasons
- Status management with color-coded chips

### Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly interface
- Optimized for all screen sizes

## Default Login
Use your admin credentials from the backend system to access the dashboard.

## Development

The application uses Vite for fast development and hot module replacement. All API calls are handled through the centralized API service with automatic token management.

## Production Deployment

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your web server
3. Configure your web server to serve the SPA correctly
4. Ensure CORS is properly configured on your backend API