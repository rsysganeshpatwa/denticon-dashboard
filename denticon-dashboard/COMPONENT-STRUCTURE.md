# Component Folder Structure

## Overview
Components are now organized by role and function for better maintainability and scalability.

## Folder Structure

```
src/components/
├── admin/                      # Admin-only components
│   ├── Dashboard.js           # Admin dashboard
│   ├── Patients.js            # Patient management (CRUD)
│   ├── Appointments.js        # Appointment management
│   ├── AppointmentRequests.js # Approve/reject appointment requests
│   ├── Providers.js           # Provider management (CRUD)
│   ├── Locations.js           # Location management
│   └── ApiDocs.js             # API documentation viewer
│
├── provider/                   # Provider-only components
│   ├── ProviderDashboard.js   # Provider dashboard with stats
│   ├── ProviderAppointments.js # View/manage own appointments
│   └── ProviderPatients.js    # View own patients
│
├── frontdesk/                  # Front desk-only components
│   └── FrontDeskDashboard.js  # Front desk dashboard
│
├── shared/                     # Shared components used by multiple roles
│   ├── Sidebar.js             # Navigation sidebar (role-aware)
│   ├── Login.js               # Login form
│   └── EditPatient.js         # Patient edit form
│
└── public/                     # Public components (no authentication)
    ├── PublicAppointmentForm.js # Public appointment booking
    └── ShareBookingLink.js      # Share booking link page
```

## Component Categories

### Admin Components (`/admin`)
**Access:** Admin role only  
**Features:**
- Full CRUD operations on all entities
- Approve/reject appointment requests
- Manage providers and locations
- View all patients and appointments
- Access to API documentation

### Provider Components (`/provider`)
**Access:** Provider role only  
**Features:**
- View personal dashboard with statistics
- Manage own appointments (confirm, complete)
- View patients assigned to them
- Update appointment status
- View patient history

### Front Desk Components (`/frontdesk`)
**Access:** Front desk role only  
**Features:**
- Check-in patients
- View today's appointments
- Book new appointments
- Manage appointment requests

### Shared Components (`/shared`)
**Access:** All authenticated users  
**Features:**
- Role-aware sidebar navigation
- Common forms and utilities
- Reusable UI components

### Public Components (`/public`)
**Access:** No authentication required  
**Features:**
- Public appointment booking form
- Share booking links

## Import Paths

### From App.js (root level):
```javascript
import Dashboard from './components/admin/Dashboard';
import ProviderDashboard from './components/provider/ProviderDashboard';
import Sidebar from './components/shared/Sidebar';
import PublicAppointmentForm from './components/public/PublicAppointmentForm';
```

### From components (nested):
```javascript
// From admin/Patients.js
import api from '../../services/api';
import EditPatient from '../shared/EditPatient';

// From provider/ProviderDashboard.js
import api from '../../services/api';
```

## Benefits

1. **Role-Based Organization**
   - Easy to identify which components belong to which role
   - Simplified access control management
   - Clear separation of concerns

2. **Scalability**
   - Easy to add new role-specific components
   - Shared components in one location
   - Better code organization as project grows

3. **Maintainability**
   - Easier to find and update components
   - Clear responsibility boundaries
   - Reduced chance of accidental cross-role access

4. **Team Collaboration**
   - Different developers can work on different roles
   - Less merge conflicts
   - Clear ownership of code sections

## Adding New Components

### Admin Component:
1. Create file in `src/components/admin/`
2. Import in `App.js` from `./components/admin/YourComponent`
3. Add route with admin protection

### Provider Component:
1. Create file in `src/components/provider/`
2. Import in `App.js` from `./components/provider/YourComponent`
3. Add route with provider protection

### Shared Component:
1. Create file in `src/components/shared/`
2. Import where needed from `../shared/YourComponent`

## Migration Notes

All component imports in `App.js` have been updated to reflect the new structure. All internal imports within components have been updated to use the correct relative paths.

**Date:** March 6, 2026
**Status:** ✅ Complete and tested
