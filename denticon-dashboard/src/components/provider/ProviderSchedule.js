import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ProviderSchedule.css';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const ProviderSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);
  const [formData, setFormData] = useState({
    day_of_week: '',
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: 30,
    is_active: true
  });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await api.get('/provider-portal/schedule');
      if (response.data && response.data.data) {
        setSchedule(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      alert('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (day) => {
    setEditingDay(day.id);
    setFormData({
      day_of_week: day.day_of_week,
      start_time: day.start_time.substring(0, 5), // HH:MM format
      end_time: day.end_time.substring(0, 5),
      slot_duration: day.slot_duration,
      is_active: day.is_active
    });
  };

  const handleCancel = () => {
    setEditingDay(null);
    setFormData({
      day_of_week: '',
      start_time: '09:00',
      end_time: '17:00',
      slot_duration: 30,
      is_active: true
    });
  };

  const handleSave = async () => {
    try {
      if (editingDay) {
        // Update existing schedule
        await api.put(`/provider-portal/schedule/${editingDay}`, formData);
        alert('Schedule updated successfully!');
      } else {
        // Create new schedule
        await api.post('/provider-portal/schedule', formData);
        alert('Schedule created successfully!');
      }
      fetchSchedule();
      handleCancel();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert(`Failed to save schedule: ${error.response?.data?.message || 'Please try again'}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await api.delete(`/provider-portal/schedule/${id}`);
        alert('Schedule deleted successfully!');
        fetchSchedule();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Failed to delete schedule');
      }
    }
  };

  const getDayLabel = (dayNum) => {
    const day = DAYS_OF_WEEK.find(d => d.value === dayNum);
    return day ? day.label : 'Unknown';
  };

  const getAvailableDays = () => {
    const usedDays = schedule.map(s => s.day_of_week);
    return DAYS_OF_WEEK.filter(d => !usedDays.includes(d.value));
  };

  if (loading) {
    return <div className="loading">Loading schedule...</div>;
  }

  return (
    <div className="provider-schedule">
      <div className="page-header">
        <h2>My Schedule & Availability</h2>
        <p className="subtitle">Manage your working hours and time slots</p>
      </div>

      <div className="schedule-info">
        <p>📅 Set your working hours for each day of the week</p>
        <p>⏰ Time slots will be automatically generated based on your slot duration</p>
        <p>🚫 Booked appointments will be grayed out for patients</p>
      </div>

      <div className="schedule-list">
        <h3>Current Schedule</h3>
        {schedule.length === 0 ? (
          <p className="no-data">No schedule set. Add your working hours below.</p>
        ) : (
          <div className="schedule-table">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Slot Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedule.sort((a, b) => a.day_of_week - b.day_of_week).map(day => (
                  <tr key={day.id} className={!day.is_active ? 'inactive' : ''}>
                    <td><strong>{getDayLabel(day.day_of_week)}</strong></td>
                    <td>{day.start_time.substring(0, 5)}</td>
                    <td>{day.end_time.substring(0, 5)}</td>
                    <td>{day.slot_duration} min</td>
                    <td>
                      <span className={`status-badge ${day.is_active ? 'active' : 'inactive'}`}>
                        {day.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit" onClick={() => handleEdit(day)}>✏️ Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete(day.id)}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="schedule-form">
        <h3>{editingDay ? 'Edit Schedule' : 'Add New Schedule'}</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Day of Week *</label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              disabled={editingDay !== null}
            >
              <option value="">Select Day</option>
              {(editingDay ? DAYS_OF_WEEK : getAvailableDays()).map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Start Time *</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>End Time *</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Slot Duration (minutes) *</label>
            <select
              value={formData.slot_duration}
              onChange={(e) => setFormData({ ...formData, slot_duration: parseInt(e.target.value) })}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>Active</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={!formData.day_of_week || !formData.start_time || !formData.end_time}
          >
            {editingDay ? '💾 Update Schedule' : '➕ Add Schedule'}
          </button>
          {editingDay && (
            <button className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="schedule-tips">
        <h4>💡 Tips:</h4>
        <ul>
          <li>Set different hours for each day of the week</li>
          <li>Uncheck "Active" to temporarily disable a day without deleting it</li>
          <li>Slot duration determines how long each appointment will be</li>
          <li>Patients will see only available (unbooked) slots</li>
        </ul>
      </div>
    </div>
  );
};

export default ProviderSchedule;
