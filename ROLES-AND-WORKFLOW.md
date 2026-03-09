# Denticon Appointment System - Roles & Workflow

## 👥 System Roles

### 1. **Admin** (Practice Manager)
**What they can do:**
- Manage all users (add/edit/delete staff, providers)
- View all appointments across all providers
- Generate reports and analytics
- System configuration and settings
- Manage locations and rooms

**Key Responsibilities:**
- Oversee practice operations
- Monitor performance metrics
- Handle billing and insurance
- Manage inventory and supplies

---

### 2. **Provider** (Doctor/Dentist)
**What they can do:**
- View their own appointments
- View patient records assigned to them
- Update appointment status (confirm, complete)
- Add treatment notes and records
- View their schedule/calendar

**Key Responsibilities:**
- Provide dental care
- Review patient history before appointments
- Complete treatment documentation
- Communicate with patients

---

### 3. **Front Desk Staff** (Receptionist)
**What they can do:**
- Create new appointments
- Edit/reschedule appointments
- Cancel appointments
- Check-in patients
- Register new patients
- Update patient information
- Handle phone calls and inquiries

**Key Responsibilities:**
- Schedule appointments
- Greet and check-in patients
- Manage daily appointment flow
- Answer patient questions
- Collect payments

---

### 4. **Patient** (External User - Future)
**What they can do:**
- View their own appointments
- Request appointments (subject to approval)
- View their treatment history
- Update personal information
- Pay bills online

**Key Responsibilities:**
- Arrive on time for appointments
- Provide accurate information
- Complete forms and consent
- Make payments

---

## 📋 Workflow Guide

### **Workflow 1: New Patient Registration**

```
Step 1: Front Desk Staff
├─ Patient walks in or calls
├─ Open "Patients" tab
├─ Click "Add New Patient"
├─ Fill in form:
│  ├─ Name, DOB, Contact
│  ├─ Insurance information
│  └─ Assign primary provider
└─ Click "Save"

Step 2: System
└─ Patient saved in database
   Patient gets unique ID

Step 3: Front Desk Staff
└─ Patient is now ready for appointment scheduling
```

---

### **Workflow 2: Schedule Appointment**

```
Step 1: Front Desk Staff
├─ Open "Appointments" tab
├─ Click "New Appointment"
└─ Fill in details:

Step 2: Select Patient
├─ Choose from dropdown
└─ System shows patient's history

Step 3: Select Provider
├─ Choose available doctor
└─ System shows provider's schedule

Step 4: Choose Date & Time
├─ Select date from calendar
├─ Pick available time slot
└─ System checks for conflicts

Step 5: Add Details
├─ Appointment type (checkup, cleaning, etc.)
├─ Reason for visit
├─ Assign room number
├─ Duration (default 30 min)
└─ Add notes if needed

Step 6: Save
├─ Click "Save Appointment"
├─ System validates data
└─ Appointment created with status "Scheduled"

Step 7: Confirmation
└─ Print/email appointment card to patient
```

---

### **Workflow 3: Day of Appointment**

```
Morning: Provider
├─ Login to system
├─ View "Today's Appointments"
└─ Review patient records for each appointment

Patient Arrives: Front Desk Staff
├─ Find appointment in list
├─ Click "Check In" or update status to "Confirmed"
├─ Patient moves to waiting room
└─ Notify provider patient is ready

Treatment: Provider
├─ See patient
├─ Perform treatment
├─ Add notes in appointment
└─ Update status to "Completed"

Checkout: Front Desk Staff
├─ Review completed appointment
├─ Generate invoice
├─ Collect payment
└─ Schedule next appointment if needed
```

---

### **Workflow 4: Reschedule/Cancel Appointment**

```
Patient Calls to Reschedule:

Step 1: Front Desk Staff
├─ Open "Appointments" tab
├─ Search for patient appointment
└─ Click "Edit"

Step 2: Update Details
├─ Change date/time to new slot
├─ Check provider availability
└─ Add reason for change

Step 3: Save Changes
├─ System updates appointment
└─ Status remains "Scheduled"

Step 4: Notify Patient
└─ Confirm new date/time with patient

---

Patient Calls to Cancel:

Step 1: Front Desk Staff
├─ Find appointment
└─ Click "Cancel"

Step 2: Confirm Cancellation
├─ Add cancellation reason
└─ Confirm action

Step 3: System Updates
├─ Status changes to "Cancelled"
├─ Time slot becomes available
└─ Logged in appointment history
```

---

### **Workflow 5: End of Day (Admin)**

```
Step 1: View Dashboard
├─ Total appointments today
├─ Completed vs No-shows
└─ Revenue generated

Step 2: Review Reports
├─ Provider performance
├─ Patient visits
└─ Pending appointments for tomorrow

Step 3: Prepare for Next Day
├─ Print appointment schedules for providers
├─ Check room availability
└─ Review any special cases
```

---

## 🔐 Permission Matrix

| Feature | Admin | Provider | Front Desk | Patient |
|---------|-------|----------|------------|---------|
| **Patients** |
| View All Patients | ✅ | ❌ | ✅ | ❌ |
| View Own Patients | ✅ | ✅ | ✅ | ❌ |
| Add New Patient | ✅ | ❌ | ✅ | ❌ |
| Edit Patient | ✅ | ❌ | ✅ | ❌ |
| Delete Patient | ✅ | ❌ | ❌ | ❌ |
| **Appointments** |
| View All Appointments | ✅ | ❌ | ✅ | ❌ |
| View Own Appointments | ✅ | ✅ | ✅ | ✅ |
| Create Appointment | ✅ | ❌ | ✅ | ❌ |
| Edit Appointment | ✅ | ⚠️ (own only) | ✅ | ❌ |
| Cancel Appointment | ✅ | ⚠️ (own only) | ✅ | ⚠️ (request) |
| Complete Appointment | ✅ | ✅ | ❌ | ❌ |
| **Providers** |
| View Providers | ✅ | ✅ | ✅ | ❌ |
| Add Provider | ✅ | ❌ | ❌ | ❌ |
| Edit Provider | ✅ | ⚠️ (self) | ❌ | ❌ |
| Delete Provider | ✅ | ❌ | ❌ | ❌ |
| **Reports** |
| View All Reports | ✅ | ❌ | ❌ | ❌ |
| View Own Reports | ✅ | ✅ | ❌ | ❌ |
| **System** |
| Settings | ✅ | ❌ | ❌ | ❌ |
| Billing | ✅ | ❌ | ⚠️ (limited) | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |

✅ Full Access  |  ⚠️ Limited Access  |  ❌ No Access

---

## 🎯 Quick Reference Guide

### For Front Desk Staff (Most Common Tasks)

**Morning Checklist:**
1. Login to system
2. View today's appointments
3. Check for cancellations/changes
4. Print provider schedules
5. Prepare patient files

**When Patient Calls:**
- "I want to schedule" → New Appointment workflow
- "I need to reschedule" → Edit Appointment workflow
- "I need to cancel" → Cancel Appointment workflow
- "What's my appointment?" → Search patient, view appointments

**When Patient Arrives:**
1. Find appointment in today's list
2. Click "Check In" or update to "Confirmed"
3. Verify patient information
4. Collect co-pay if applicable
5. Direct to waiting room

**When Patient Leaves:**
1. Click "Complete" if provider hasn't already
2. Generate invoice/receipt
3. Schedule next appointment
4. Give patient appointment card

---

### For Providers (Most Common Tasks)

**Morning Routine:**
1. Login to system
2. View "Today's Appointments"
3. Review each patient's:
   - Last visit notes
   - Treatment history
   - Allergies/medical conditions
   - Insurance information

**During Appointment:**
1. See patient
2. Perform treatment
3. Add notes in system
4. Update status to "Completed"
5. Note any follow-up needed

**End of Day:**
1. Review all completed appointments
2. Finalize any pending notes
3. Check tomorrow's schedule
4. Sign off on any required documents

---

### For Admin (Most Common Tasks)

**Daily:**
- Review dashboard metrics
- Check no-shows and cancellations
- Monitor revenue
- Handle escalations

**Weekly:**
- Generate reports
- Review provider schedules
- Check inventory levels
- Plan staff schedules

**Monthly:**
- Financial reports
- Performance reviews
- System maintenance
- Backup verification

---

## 📞 Support & Training

### Need Help?
- **Technical Issues**: Contact IT Support
- **System Questions**: Check User Manual
- **Process Questions**: Ask Practice Manager
- **Emergency**: Call Admin directly

### Training Resources:
1. Video tutorials (link)
2. User manual PDF (link)
3. Quick reference cards (print)
4. Weekly Q&A sessions

---

## 🚨 Common Scenarios

### Scenario 1: Double Booking
**Problem**: Two appointments at same time  
**Solution**: 
- Check which was created first
- Call patient who booked later
- Offer alternative time slots
- Document the resolution

### Scenario 2: Provider Running Late
**Problem**: Doctor delayed, patients waiting  
**Solution**:
- Update appointment times in system
- Inform waiting patients of delay
- Offer rescheduling option
- Log incident for review

### Scenario 3: Emergency Walk-in
**Problem**: Patient needs immediate care  
**Solution**:
- Create emergency appointment
- Assign next available provider
- Mark as "Emergency" type
- Adjust schedule as needed

### Scenario 4: Patient No-Show
**Problem**: Patient didn't arrive  
**Solution**:
- Wait 15 minutes past appointment time
- Try calling patient
- Update status to "No-Show"
- Follow practice no-show policy

---

**This guide should be printed and kept at each workstation for easy reference!**
