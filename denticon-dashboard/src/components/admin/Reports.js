import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../services/api';
import './Reports.css';

function Reports() {
  const [activeReport, setActiveReport] = useState('appointments');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)),
    end_date: new Date(),
    status: '',
    provider_id: '',
    location_id: '',
    overdue_only: false
  });
  const [providers, setProviders] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchProviders();
    fetchLocations();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await api.get('/Provider');
      if (response.data && response.data.data) {
        setProviders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/Location');
      if (response.data && response.data.data) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.start_date) {
        params.append('start_date', filters.start_date.toISOString().split('T')[0]);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date.toISOString().split('T')[0]);
      }
      if (filters.status) params.append('status', filters.status);
      if (filters.provider_id) params.append('provider_id', filters.provider_id);
      if (filters.location_id) params.append('location_id', filters.location_id);
      if (filters.overdue_only) params.append('overdue_only', filters.overdue_only);

      const response = await api.get(`/reports/${activeReport}?${params.toString()}`);
      
      if (response.data && response.data.data) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format = 'csv') => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) {
        params.append('start_date', filters.start_date.toISOString().split('T')[0]);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date.toISOString().split('T')[0]);
      }

      const response = await api.get(`/reports/export/${activeReport}?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeReport}-report-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const printReport = () => {
    window.print();
  };

  const renderFilters = () => {
    return (
      <div className="report-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Start Date:</label>
            <DatePicker
              selected={filters.start_date}
              onChange={(date) => setFilters({ ...filters, start_date: date })}
              dateFormat="yyyy-MM-dd"
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>End Date:</label>
            <DatePicker
              selected={filters.end_date}
              onChange={(date) => setFilters({ ...filters, end_date: date })}
              dateFormat="yyyy-MM-dd"
              className="filter-input"
            />
          </div>

          {(activeReport === 'appointments' || activeReport === 'follow-ups') && (
            <>
              <div className="filter-group">
                <label>Provider:</label>
                <select
                  value={filters.provider_id}
                  onChange={(e) => setFilters({ ...filters, provider_id: e.target.value })}
                  className="filter-input"
                >
                  <option value="">All Providers</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      Dr. {provider.first_name} {provider.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Location:</label>
                <select
                  value={filters.location_id}
                  onChange={(e) => setFilters({ ...filters, location_id: e.target.value })}
                  className="filter-input"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {activeReport === 'appointments' && (
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="filter-input"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
          )}

          {activeReport === 'follow-ups' && (
            <div className="filter-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={filters.overdue_only}
                  onChange={(e) => setFilters({ ...filters, overdue_only: e.target.checked })}
                  style={{ width: 'auto' }}
                />
                <span>Overdue Only</span>
              </label>
            </div>
          )}
        </div>

        <div className="filter-actions">
          <button onClick={generateReport} className="btn-generate" disabled={loading}>
            {loading ? '⏳ Generating...' : '📊 Generate Report'}
          </button>
          {reportData && (
            <>
              <button onClick={() => exportReport('csv')} className="btn-export">
                📥 Export CSV
              </button>
              <button onClick={printReport} className="btn-print">
                🖨️ Print
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderAppointmentsReport = () => {
    if (!reportData || !reportData.appointments) return null;

    return (
      <div className="report-content" data-report-type="Appointments">
        <div className="statistics-cards">
          <div className="stat-card">
            <div className="stat-value">{reportData.statistics.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
          <div className="stat-card stat-completed">
            <div className="stat-value">{reportData.statistics.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card stat-scheduled">
            <div className="stat-value">{reportData.statistics.scheduled}</div>
            <div className="stat-label">Scheduled</div>
          </div>
          <div className="stat-card stat-cancelled">
            <div className="stat-value">{reportData.statistics.cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
          <div className="stat-card stat-noshow">
            <div className="stat-value">{reportData.statistics.noShow}</div>
            <div className="stat-label">No Show</div>
          </div>
          <div className="stat-card stat-followup">
            <div className="stat-value">{reportData.statistics.followUpsRequired}</div>
            <div className="stat-label">Follow-ups</div>
          </div>
        </div>

        <div className="metrics-row">
          <div className="metric">
            <strong>Completion Rate:</strong> {reportData.statistics.completionRate}%
          </div>
          <div className="metric">
            <strong>No-Show Rate:</strong> {reportData.statistics.noShowRate}%
          </div>
        </div>

        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Provider</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Diagnosis</th>
                <th>Treatment</th>
              </tr>
            </thead>
            <tbody>
              {reportData.appointments.map((apt) => (
                <tr key={apt.id}>
                  <td>{new Date(apt.appointment_date).toLocaleDateString()}</td>
                  <td>{apt.appointment_time}</td>
                  <td>
                    <strong>{apt.patient_name}</strong><br />
                    <small>{apt.patient_phone}</small>
                  </td>
                  <td>{apt.provider_name}</td>
                  <td>{apt.location_name}</td>
                  <td>{apt.appointment_type}</td>
                  <td>
                    <span className={`status-badge status-${apt.status}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>{apt.diagnosis || '-'}</td>
                  <td>{apt.treatment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPatientsReport = () => {
    if (!reportData) return null;

    return (
      <div className="report-content" data-report-type="Patients">
        <div className="statistics-cards">
          <div className="stat-card">
            <div className="stat-value">{reportData.totalPatients}</div>
            <div className="stat-label">Total Patients</div>
          </div>
          <div className="stat-card stat-completed">
            <div className="stat-value">{reportData.newPatients}</div>
            <div className="stat-label">New Patients (Period)</div>
          </div>
          <div className="stat-card stat-cancelled">
            <div className="stat-value">{reportData.patientsWithoutAppointments.length}</div>
            <div className="stat-label">No Appointments</div>
          </div>
        </div>

        <h3>Top Patients by Appointment Count</h3>
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Appointments</th>
                <th>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topPatients.map((patient) => (
                <tr key={patient.id}>
                  <td><strong>{patient.patient_name}</strong></td>
                  <td>{patient.patient_phone}</td>
                  <td>{patient.patient_email}</td>
                  <td>{patient.appointment_count}</td>
                  <td>{patient.last_visit_date ? new Date(patient.last_visit_date).toLocaleDateString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProvidersReport = () => {
    if (!reportData || !reportData.providers) return null;

    return (
      <div className="report-content" data-report-type="Providers">
        <h3>Provider Performance</h3>
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Specialization</th>
                <th>Location</th>
                <th>Total</th>
                <th>Completed</th>
                <th>Scheduled</th>
                <th>Cancelled</th>
                <th>No Show</th>
                <th>Unique Patients</th>
                <th>Follow-ups</th>
                <th>Completion %</th>
                <th>No-Show %</th>
              </tr>
            </thead>
            <tbody>
              {reportData.providers.map((provider) => (
                <tr key={provider.id}>
                  <td><strong>{provider.provider_name}</strong></td>
                  <td>{provider.specialization}</td>
                  <td>{provider.location_name}</td>
                  <td>{provider.total_appointments}</td>
                  <td className="text-success">{provider.completed_appointments}</td>
                  <td className="text-info">{provider.scheduled_appointments}</td>
                  <td className="text-warning">{provider.cancelled_appointments}</td>
                  <td className="text-danger">{provider.no_show_appointments}</td>
                  <td>{provider.unique_patients}</td>
                  <td>{provider.follow_ups_required}</td>
                  <td><strong>{provider.completionRate}%</strong></td>
                  <td><strong>{provider.noShowRate}%</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFollowUpsReport = () => {
    if (!reportData || !reportData.followUps) return null;

    return (
      <div className="report-content" data-report-type="Follow-ups">
        <div className="statistics-cards">
          <div className="stat-card stat-cancelled">
            <div className="stat-value">{reportData.statistics.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-value">{reportData.statistics.dueToday}</div>
            <div className="stat-label">Due Today</div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-value">{reportData.statistics.dueThisWeek}</div>
            <div className="stat-label">Due This Week</div>
          </div>
          <div className="stat-card stat-completed">
            <div className="stat-value">{reportData.statistics.upcoming}</div>
            <div className="stat-label">Upcoming</div>
          </div>
        </div>

        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Urgency</th>
                <th>Patient</th>
                <th>Phone</th>
                <th>Provider</th>
                <th>Last Visit</th>
                <th>Next Visit Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {reportData.followUps.map((followUp) => (
                <tr key={followUp.id} className={`urgency-${followUp.urgency.toLowerCase().replace(' ', '-')}`}>
                  <td>
                    <span className={`urgency-badge urgency-${followUp.urgency.toLowerCase().replace(' ', '-')}`}>
                      {followUp.urgency}
                    </span>
                  </td>
                  <td>
                    <strong>{followUp.patient_name}</strong>
                  </td>
                  <td>{followUp.patient_phone}</td>
                  <td>{followUp.provider_name}</td>
                  <td>{new Date(followUp.last_visit_date).toLocaleDateString()}</td>
                  <td><strong>{new Date(followUp.next_visit_date).toLocaleDateString()}</strong></td>
                  <td>{followUp.follow_up_notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>📊 Reports & Analytics</h2>
        <p className="subtitle">Generate comprehensive reports for your practice</p>
      </div>

      <div className="report-tabs">
        <button
          className={`tab-btn ${activeReport === 'appointments' ? 'active' : ''}`}
          onClick={() => { setActiveReport('appointments'); setReportData(null); }}
        >
          📅 Appointments
        </button>
        <button
          className={`tab-btn ${activeReport === 'patients' ? 'active' : ''}`}
          onClick={() => { setActiveReport('patients'); setReportData(null); }}
        >
          👥 Patients
        </button>
        <button
          className={`tab-btn ${activeReport === 'providers' ? 'active' : ''}`}
          onClick={() => { setActiveReport('providers'); setReportData(null); }}
        >
          👨‍⚕️ Providers
        </button>
        <button
          className={`tab-btn ${activeReport === 'follow-ups' ? 'active' : ''}`}
          onClick={() => { setActiveReport('follow-ups'); setReportData(null); }}
        >
          🔔 Follow-ups
        </button>
      </div>

      <div className="report-body">
        {renderFilters()}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Generating report...</p>
          </div>
        )}

        {!loading && reportData && (
          <>
            {activeReport === 'appointments' && renderAppointmentsReport()}
            {activeReport === 'patients' && renderPatientsReport()}
            {activeReport === 'providers' && renderProvidersReport()}
            {activeReport === 'follow-ups' && renderFollowUpsReport()}
          </>
        )}

        {!loading && !reportData && (
          <div className="no-report-message">
            <p>📊 Select filters and click "Generate Report" to view analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
