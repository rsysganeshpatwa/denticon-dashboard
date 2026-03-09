import React, { useState } from 'react';
import './UserManual.css';

const UserManual = () => {
  const [activeStep, setActiveStep] = useState(null);

  const workflowSteps = [
    {
      id: 1,
      title: 'Step 1: Public Appointment Request',
      role: 'Patient/Public User',
      description: 'Patient submits an appointment request through the public booking form',
      icon: '📝',
      details: [
        'Navigate to the public booking page (e.g., /book-appointment)',
        'Fill in personal information: Name, Email, Phone',
        'Select a location from the dropdown',
        'Choose a provider based on the selected location',
        'Pick an appointment date using the calendar',
        'Select an available time slot from the displayed slots',
        'Provide a reason for the visit',
        'Click "Submit Request" button',
        'Receive confirmation message with request ID',
        'Request status is set to "Pending"'
      ],
      screenshot: '🖼️ Shows public booking form with all fields filled',
      nextStep: 'The request is now visible to Admin staff'
    },
    {
      id: 2,
      title: 'Step 2: Request Review',
      role: 'Admin',
      description: 'Admin reviews the pending appointment request',
      icon: '👀',
      details: [
        'Login to the dashboard with admin credentials',
        'Navigate to "Appointment Requests" from the sidebar',
        'View the list of pending appointment requests',
        'Click on a pending request to view details',
        'Review patient information: name, email, phone',
        'Check selected provider and requested date/time',
        'Read the reason for visit',
        'Verify time slot availability',
        'Decide to approve or reject the request'
      ],
      screenshot: '🖼️ Shows appointment requests list with pending items',
      nextStep: 'Admin can approve or reject the request'
    },
    {
      id: 3,
      title: 'Step 3: Patient Record Creation',
      role: 'Admin',
      description: 'For new patients, create a patient record before approving',
      icon: '👤',
      details: [
        'Check if patient already exists in the system',
        'If new patient, go to "Patients" section',
        'Click "Add Patient" button',
        'Fill in patient details:',
        '  - First Name, Last Name',
        '  - Email, Phone',
        '  - Date of Birth',
        '  - Address, City, State, ZIP',
        '  - Emergency Contact Name & Phone',
        '  - Insurance Provider & Policy Number',
        'Click "Save" to create patient record',
        'Note the Patient ID for the next step'
      ],
      screenshot: '🖼️ Shows patient creation form',
      nextStep: 'Patient record is now available for appointment approval'
    },
    {
      id: 4,
      title: 'Step 4: Approve Request & Create Appointment',
      role: 'Admin',
      description: 'Approve the request and convert it to a confirmed appointment',
      icon: '✅',
      details: [
        'Go back to "Appointment Requests"',
        'Click "Approve" button on the pending request',
        'In the approval modal:',
        '  - Select the patient from dropdown (created in Step 3)',
        '  - Confirm the appointment type (checkup, cleaning, etc.)',
        '  - Add any internal notes if needed',
        'Click "Approve Request"',
        'System automatically creates an appointment',
        'Request status changes to "Approved"',
        'Appointment appears in "Appointments" section',
        'Appointment status is set to "Scheduled"'
      ],
      screenshot: '🖼️ Shows approve modal with patient selection',
      nextStep: 'Appointment is now scheduled and visible to the provider'
    },
    {
      id: 5,
      title: 'Step 5: Provider Views Schedule',
      role: 'Provider',
      description: 'Provider logs in and views their scheduled appointments',
      icon: '👨‍⚕️',
      details: [
        'Provider logs in with their credentials',
        'Dashboard shows today\'s appointments count',
        'Navigate to "My Appointments" section',
        'View list of all scheduled appointments',
        'Filter by date to see today\'s schedule',
        'See appointment details:',
        '  - Patient name and contact',
        '  - Appointment time',
        '  - Appointment type (checkup, cleaning, etc.)',
        '  - Patient notes/reason for visit',
        'Prepare for the appointment'
      ],
      screenshot: '🖼️ Shows provider dashboard with appointment list',
      nextStep: 'Provider is ready to see the patient'
    },
    {
      id: 6,
      title: 'Step 6: Patient Check-in',
      role: 'Admin / Provider',
      description: 'Patient arrives and checks in for the appointment',
      icon: '🏥',
      details: [
        'Patient arrives at the clinic',
        'Admin or clinic staff verifies patient identity',
        'Confirm appointment in the system',
        'Update appointment status to "Confirmed" if needed',
        'Notify provider that patient has arrived',
        'Patient is directed to waiting area',
        'Provider is notified when ready to see patient'
      ],
      screenshot: '🖼️ Shows appointment status update options',
      nextStep: 'Provider proceeds with the consultation'
    },
    {
      id: 7,
      title: 'Step 7: Appointment Consultation',
      role: 'Provider',
      description: 'Provider conducts the appointment consultation',
      icon: '🩺',
      details: [
        'Provider calls patient from waiting area',
        'Conduct examination/consultation',
        'Discuss patient concerns and symptoms',
        'Perform necessary procedures',
        'Provide diagnosis and treatment plan',
        'Prescribe medications if needed',
        'Schedule follow-up appointment if required',
        'Answer any patient questions'
      ],
      screenshot: '🖼️ Shows appointment in progress',
      nextStep: 'Provider completes the appointment documentation'
    },
    {
      id: 8,
      title: 'Step 8: Complete Appointment',
      role: 'Provider',
      description: 'Provider marks the appointment as completed and adds notes',
      icon: '✔️',
      details: [
        'After consultation, provider accesses the appointment',
        'Click on the appointment to edit',
        'Update appointment status to "Completed"',
        'Add clinical notes:',
        '  - Chief complaint',
        '  - Examination findings',
        '  - Diagnosis',
        '  - Treatment provided',
        '  - Follow-up recommendations',
        'Save the updated appointment',
        'System records completion time',
        'Appointment moves to completed status'
      ],
      screenshot: '🖼️ Shows appointment edit with status change to completed',
      nextStep: 'Appointment workflow is complete'
    },
    {
      id: 9,
      title: 'Step 9: Post-Appointment (Optional)',
      role: 'Admin',
      description: 'Handle billing and schedule follow-ups',
      icon: '💳',
      details: [
        'Admin reviews completed appointment',
        'Process payment/billing if applicable',
        'If follow-up needed:',
        '  - Navigate to "Appointments"',
        '  - Click "Schedule Appointment"',
        '  - Select the same patient',
        '  - Choose provider and date/time',
        '  - Add notes referencing previous visit',
        'Send confirmation to patient',
        'Update patient records if needed'
      ],
      screenshot: '🖼️ Shows scheduling follow-up appointment',
      nextStep: 'Complete appointment cycle ends, new cycle may begin'
    }
  ];

  const quickLinks = [
    { title: 'Public Booking Form', path: '/book-appointment', icon: '🌐' },
    { title: 'Admin Dashboard', path: '/dashboard', icon: '📊' },
    { title: 'Appointment Requests', path: '/appointment-requests', icon: '📋' },
    { title: 'Patients', path: '/patients', icon: '👥' },
    { title: 'Appointments', path: '/appointments', icon: '📅' },
    { title: 'Providers', path: '/providers', icon: '👨‍⚕️' }
  ];

  const roles = [
    {
      name: 'Admin',
      credentials: 'admin / Admin@2026',
      permissions: [
        'Full system access',
        'Manage patients, providers, locations',
        'Approve/reject appointment requests',
        'View all appointments',
        'Schedule appointments',
        'Generate reports'
      ]
    },
    {
      name: 'Provider',
      credentials: 'john.smith / Provider@2026 or sarah.johnson / Provider@2026',
      permissions: [
        'View own appointments',
        'Update appointment status',
        'Add clinical notes',
        'View patient details',
        'Manage own schedule'
      ]
    }
  ];

  return (
    <div className="user-manual">
      <div className="manual-header">
        <h1>📖 User Manual</h1>
        <p>Complete workflow guide from public booking to appointment completion</p>
      </div>

      <div className="manual-content">
        {/* Overview Section */}
        <section className="manual-section overview-section">
          <h2>🎯 Workflow Overview</h2>
          <p>
            This guide walks you through the complete appointment lifecycle in the Denticon Healthcare Management System,
            from initial patient request to final appointment completion by the provider.
          </p>
          
          <div className="workflow-diagram">
            <div className="workflow-path">
              {workflowSteps.map((step, index) => (
                <div key={step.id} className="workflow-node">
                  <div className="node-icon">{step.icon}</div>
                  <div className="node-title">{step.title}</div>
                  <div className="node-role">{step.role}</div>
                  {index < workflowSteps.length - 1 && <div className="node-arrow">→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="manual-section quick-links-section">
          <h2>🔗 Quick Access Links</h2>
          <div className="quick-links-grid">
            {quickLinks.map((link, index) => (
              <div key={index} className="quick-link-card">
                <span className="link-icon">{link.icon}</span>
                <span className="link-title">{link.title}</span>
                <code className="link-path">{link.path}</code>
              </div>
            ))}
          </div>
        </section>

        {/* Roles & Permissions */}
        <section className="manual-section roles-section">
          <h2>👥 User Roles & Permissions</h2>
          <div className="roles-grid">
            {roles.map((role, index) => (
              <div key={index} className="role-card">
                <h3>{role.name}</h3>
                <div className="role-credentials">
                  <strong>Demo Credentials:</strong>
                  <code>{role.credentials}</code>
                </div>
                <div className="role-permissions">
                  <strong>Permissions:</strong>
                  <ul>
                    {role.permissions.map((permission, idx) => (
                      <li key={idx}>{permission}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Steps */}
        <section className="manual-section steps-section">
          <h2>📋 Detailed Step-by-Step Guide</h2>
          <div className="steps-container">
            {workflowSteps.map((step) => (
              <div 
                key={step.id} 
                className={`step-card ${activeStep === step.id ? 'expanded' : ''}`}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
              >
                <div className="step-header">
                  <span className="step-icon">{step.icon}</span>
                  <div className="step-info">
                    <h3>{step.title}</h3>
                    <span className="step-role">{step.role}</span>
                  </div>
                  <span className="expand-icon">{activeStep === step.id ? '−' : '+'}</span>
                </div>
                
                <div className="step-description">
                  {step.description}
                </div>

                {activeStep === step.id && (
                  <div className="step-details">
                    <div className="details-section">
                      <h4>📝 Detailed Instructions:</h4>
                      <ol>
                        {step.details.map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ol>
                    </div>
                    
                    <div className="details-section next-step">
                      <h4>➡️ What Happens Next:</h4>
                      <p>{step.nextStep}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tips & Best Practices */}
        <section className="manual-section tips-section">
          <h2>💡 Tips & Best Practices</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <h3>🎯 For Patients</h3>
              <ul>
                <li>Book appointments in advance for better slot availability</li>
                <li>Provide accurate contact information</li>
                <li>Arrive 10-15 minutes before appointment time</li>
                <li>Bring insurance cards and ID</li>
              </ul>
            </div>
            <div className="tip-card">
              <h3>⚙️ For Admins</h3>
              <ul>
                <li>Review requests promptly to ensure timely confirmations</li>
                <li>Verify patient information before approval</li>
                <li>Create complete patient records with all details</li>
                <li>Keep provider and location information up-to-date</li>
                <li>Monitor pending requests regularly</li>
                <li>Ensure proper user role assignments</li>
              </ul>
            </div>
            <div className="tip-card">
              <h3>👨‍⚕️ For Providers</h3>
              <ul>
                <li>Check your schedule daily</li>
                <li>Add detailed clinical notes after each appointment</li>
                <li>Mark appointments as completed promptly</li>
                <li>Communicate follow-up needs to admin staff</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="manual-section troubleshooting-section">
          <h2>🔧 Common Issues & Solutions</h2>
          <div className="troubleshooting-list">
            <div className="issue-card">
              <h3>❓ No Available Time Slots</h3>
              <p><strong>Solution:</strong> Select a different date or provider. Time slots are based on provider availability and existing appointments.</p>
            </div>
            <div className="issue-card">
              <h3>❓ Cannot Find Patient Record</h3>
              <p><strong>Solution:</strong> Create a new patient record before approving the appointment request. Ensure all required fields are filled.</p>
            </div>
            <div className="issue-card">
              <h3>❓ Appointment Request Not Showing</h3>
              <p><strong>Solution:</strong> Check the status filter. Pending requests appear in the "Appointment Requests" section. Approved requests become appointments.</p>
            </div>
            <div className="issue-card">
              <h3>❓ Provider Cannot See Appointments</h3>
              <p><strong>Solution:</strong> Ensure provider is logged in with correct credentials. Check that appointments are assigned to the correct provider ID.</p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="manual-section support-section">
          <h2>📞 Need Help?</h2>
          <div className="support-info">
            <p>If you encounter any issues not covered in this manual, please contact support:</p>
            <div className="support-details">
              <div className="support-item">
                <strong>📧 Email:</strong> support@denticon.com
              </div>
              <div className="support-item">
                <strong>📱 Phone:</strong> 1-800-DENTICON
              </div>
              <div className="support-item">
                <strong>⏰ Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM PST
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserManual;
