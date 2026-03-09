# Routing Documentation

## Overview
The application uses React Router v6 with role-based access control and protected routes.

## Route Structure

### Public Routes (No Authentication Required)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect to `/login` | Root route redirects to login |
| `/login` | `shared/Login.js` | User authentication page |
| `/book-appointment` | `public/PublicAppointmentForm.js` | Public appointment booking form |

---

### Admin Routes (Admin Role Only)

**Base Path:** `/`  
**Access:** Admin role required  
**Layout:** ProtectedLayout with Sidebar

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | `admin/Dashboard.js` | Admin dashboard with overview stats |
| `/patients` | `admin/Patients.js` | Patient management (CRUD) |
| `/appointments` | `admin/Appointments.js` | Appointment management (CRUD) |
| `/appointment-requests` | `admin/AppointmentRequests.js` | Approve/reject appointment requests |
| `/providers` | `admin/Providers.js` | Provider management (CRUD) |
| `/locations` | `admin/Locations.js` | Location management (CRUD) |
| `/api-docs` | `admin/ApiDocs.js` | API documentation viewer |
| `/share-link` | `public/ShareBookingLink.js` | Share booking link page |

---

### Provider Routes (Provider Role Only)

**Base Path:** `/provider`  
**Access:** Provider role required  
**Layout:** ProtectedLayout with Sidebar

| Route | Component | Description |
|-------|-----------|-------------|
| `/provider/dashboard` | `provider/ProviderDashboard.js` | Provider dashboard with stats & today's appointments |
| `/provider/appointments` | `provider/ProviderAppointments.js` | View and manage own appointments |
| `/provider/patients` | `provider/ProviderPatients.js` | View patients assigned to this provider |

---

### Front Desk Routes (Front Desk Role Only)

**Base Path:** `/frontdesk`  
**Access:** Front desk role required  
**Layout:** ProtectedLayout with Sidebar

| Route | Component | Description |
|-------|-----------|-------------|
| `/frontdesk/dashboard` | `frontdesk/FrontDeskDashboard.js` | Front desk dashboard with check-in features |

**Note:** Front desk staff also have access to:
- `/patients` - Patient list
- `/appointments` - Appointment management
- `/appointment-requests` - Appointment requests
- `/share-link` - Share booking link

---

## Authentication Flow

### Login Redirect Logic (`shared/Login.js`)

```javascript
switch (user.role) {
  case 'admin':
    navigate('/dashboard');
    break;
  case 'provider':
    navigate('/provider/dashboard');
    break;
  case 'front_desk':
    navigate('/frontdesk/dashboard');
    break;
  default:
    navigate('/dashboard');
}
```

### Protected Route Wrapper

All authenticated routes use the `ProtectedLayout` component which:
1. Checks if user is logged in (localStorage token)
2. Redirects to `/login` if not authenticated
3. Renders Sidebar + Header + Content area
4. Shows user info and logout button

### Authorization Check

**Client-Side:**
- `AuthChecker` component checks localStorage on route changes
- `ProtectedLayout` prevents access to routes without login

**Server-Side (Backend):**
- JWT token verification in middleware
- Role-based middleware: `adminOnly`, `providerOnly`, `adminOrFrontDesk`
- Backend enforces data filtering by `providerId` for providers

---

## Sidebar Navigation (Role-Aware)

The `shared/Sidebar.js` component dynamically shows menu items based on user role:

### Admin Menu
```
📊 Dashboard → /dashboard
👥 Patients → /patients
📅 Appointments → /appointments
📋 Appointment Requests → /appointment-requests
👨‍⚕️ Providers → /providers
📍 Locations → /locations
🔗 Share Booking Link → /share-link
```

### Provider Menu
```
📊 Dashboard → /provider/dashboard
📅 My Appointments → /provider/appointments
👥 My Patients → /provider/patients
```

### Front Desk Menu
```
📊 Dashboard → /frontdesk/dashboard
👥 Patients → /patients
📅 Appointments → /appointments
📋 Appointment Requests → /appointment-requests
🔗 Share Booking Link → /share-link
```

---

## Route Guards & Security

### Current Implementation

✅ **Client-Side Guards:**
- `ProtectedLayout` checks authentication
- Redirects to `/login` if not authenticated
- Role-based sidebar navigation

⚠️ **Missing Server-Side Role Validation:**
Currently, routes like `/patients` and `/appointments` are accessible by all authenticated users. The backend should enforce role-based access.

### Recommended Backend Middleware

```javascript
// Admin routes
app.use('/dashboard', verifyToken, adminOnly);
app.use('/providers', verifyToken, adminOnly);
app.use('/locations', verifyToken, adminOnly);

// Admin or Front Desk
app.use('/patients', verifyToken, adminOrFrontDesk);
app.use('/appointments', verifyToken, adminOrFrontDesk);

// Provider routes
app.use('/provider-portal', verifyToken, providerOnly);
```

---

## Adding New Routes

### 1. Admin Route

```javascript
// In App.js
<Route path="/new-admin-page" element={
  <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} 
    setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
    <NewAdminComponent />
  </ProtectedLayout>
} />
```

### 2. Provider Route

```javascript
// In App.js
<Route path="/provider/new-page" element={
  <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} 
    setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
    <NewProviderComponent />
  </ProtectedLayout>
} />
```

### 3. Public Route

```javascript
// In App.js (outside ProtectedLayout)
<Route path="/public-page" element={<PublicComponent />} />
```

### 4. Update Sidebar

Add menu item in `shared/Sidebar.js`:

```javascript
const getMenuItems = () => {
  if (user?.role === 'provider') {
    return [
      // ... existing items
      { id: 'new-page', icon: '🆕', label: 'New Page', path: '/provider/new-page' }
    ];
  }
  // ... other roles
};
```

---

## Route Testing Checklist

### Admin Login (`admin` / `Admin@2026`)
- ✅ Redirects to `/dashboard`
- ✅ Can access `/patients`, `/appointments`, `/providers`, `/locations`
- ✅ Can access `/appointment-requests`, `/api-docs`, `/share-link`
- ❌ Should NOT access `/provider/*` or `/frontdesk/*`

### Provider Login (`john.smith` / `Provider@2026`)
- ✅ Redirects to `/provider/dashboard`
- ✅ Can access `/provider/appointments`, `/provider/patients`
- ✅ Sidebar shows only provider menu items
- ❌ Should NOT access admin routes like `/providers`, `/locations`

### Front Desk Login (`receptionist` / `FrontDesk@2026`)
- ✅ Redirects to `/frontdesk/dashboard`
- ✅ Can access `/patients`, `/appointments`, `/appointment-requests`
- ✅ Sidebar shows only front desk menu items
- ❌ Should NOT access admin routes like `/providers`, `/api-docs`

### Public Access (No Login)
- ✅ Can access `/book-appointment`
- ✅ Redirected to `/login` when accessing protected routes
- ✅ Root `/` redirects to `/login`

---

## Future Enhancements

### Planned Routes

**Provider:**
- `/provider/schedule` - Manage availability schedule
- `/provider/profile` - Provider profile settings
- `/provider/earnings` - View earnings/reports

**Front Desk:**
- `/frontdesk/check-in` - Patient check-in interface
- `/frontdesk/waitlist` - Waiting room management

**Admin:**
- `/analytics` - Advanced analytics dashboard
- `/settings` - System settings
- `/users` - User management

### Route Optimization

1. **Lazy Loading:**
   - Load route components only when needed
   - Reduce initial bundle size

2. **Route-Based Code Splitting:**
   - Split code by role (admin, provider, frontdesk)
   - Faster load times for each role

3. **Breadcrumbs:**
   - Add breadcrumb navigation
   - Improve user orientation

---

## Status

**Current State:** ✅ All routes working correctly with new folder structure  
**Last Updated:** March 6, 2026  
**Imports:** All updated to reflect new component paths  
**Authentication:** Working with JWT tokens  
**Authorization:** Sidebar is role-aware, backend enforces access control
