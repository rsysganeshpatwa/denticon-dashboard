import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../services/api';
import '../admin/Reports.css';

function ProviderReports() {
  const [activeReport, setActiveReport] = useState('appointments');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)),
    end_date: new Date(),
    status: '',
    overdue_only: false
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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
      if (filters.overdue_only) params.append('overdue_only', filters.overdue_only);
      if (user?.provider?.id) params.append('provider_id', user.provider.id);

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
            <button onClick={printReport} className="btn-print">
              🖨️ Print
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAppointmentsReport = () => {
    if (!reportData || !reportData.appointments) return null;

    return (
      <div className="report-content">
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

  const renderFollowUpsReport = () => {
    if (!reportData || !reportData.followUps) return null;

    return (
      <div className="report-content">
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
        <h2>📊 My Reports</h2>
        <p className="subtitle">View your appointment and patient statistics</p>
      </div>

      <div className="report-tabs">
        <button
          className={`tab-btn ${activeReport === 'appointments' ? 'active' : ''}`}
          onClick={() => { setActiveReport('appointments'); setReportData(null); }}
        >
          📅 My Appointments
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
            {activeReport === 'follow-ups' && renderFollowUpsReport()}
          </>
        )}

        {!loading && !reportData && (
          <div className="no-report-message">
            <p>📊 Select filters and click "Generate Report" to view your analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderReports;
