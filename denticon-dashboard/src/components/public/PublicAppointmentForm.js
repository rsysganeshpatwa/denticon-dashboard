import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './PublicAppointmentForm.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');

function PublicAppointmentForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    medical_history: '',
    diagnosis: '',
    location_id: '',
    provider_id: '',
    requested_date: '',
    requested_time: '',
    notes: ''
  });

  const [locations, setLocations] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState(new Set());
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Fetch providers when location changes
  useEffect(() => {
    if (formData.location_id) {
      fetchProviders(formData.location_id);
    } else {
      setFilteredProviders([]);
      setFormData(prev => ({ ...prev, provider_id: '', requested_time: '' }));
      setAvailableSlots([]);
      setAvailableDates(new Set());
    }
  }, [formData.location_id]);

  // Fetch available dates when provider changes
  useEffect(() => {
    if (formData.provider_id) {
      fetchAvailableDates(formData.provider_id);
    } else {
      setAvailableDates(new Set());
      setFormData(prev => ({ ...prev, requested_date: '', requested_time: '' }));
    }
  }, [formData.provider_id]);

  // Fetch available slots when provider and date change
  useEffect(() => {
    if (formData.provider_id && formData.requested_date) {
      fetchAvailableSlots(formData.provider_id, formData.requested_date);
    } else {
      setAvailableSlots([]);
      setFormData(prev => ({ ...prev, requested_time: '' }));
    }
  }, [formData.provider_id, formData.requested_date]);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/public/locations`);
      if (response.data && response.data.data) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchProviders = async (locationId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/public/providers?location_id=${locationId}`);
      if (response.data && response.data.data) {
        const providers = response.data.data;
        setFilteredProviders(providers);
        // Auto-select the first provider if available
        if (providers.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            provider_id: providers[0].id.toString(),
            requested_date: '', 
            requested_time: '' 
          }));
        } else {
          setFormData(prev => ({ ...prev, provider_id: '', requested_date: '', requested_time: '' }));
        }
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchAvailableDates = async (providerId) => {
    try {
      setLoadingDates(true);
      // Use optimized bulk endpoint
      const response = await axios.get(`${API_BASE_URL}/public/providers/${providerId}/available-dates?days=60`);
      
      if (response.data && response.data.data) {
        setAvailableDates(new Set(response.data.data));
      } else {
        setAvailableDates(new Set());
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
      setAvailableDates(new Set());
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchAvailableSlots = async (providerId, date) => {
    try {
      setLoadingSlots(true);
      // Send client's current time to server for accurate past time detection
      const now = new Date();
      const clientTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
      const response = await axios.get(`${API_BASE_URL}/public/providers/${providerId}/availability?date=${date}&currentTime=${clientTime}`);
      if (response.data && response.data.data) {
        setAvailableSlots(response.data.data);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.diagnosis || !formData.diagnosis.trim()) newErrors.diagnosis = 'Reason for visit is required';
    if (!formData.location_id) newErrors.location_id = 'Please select a location';
    if (!formData.requested_date) newErrors.requested_date = 'Preferred date is required';
    if (!formData.requested_time) newErrors.requested_time = 'Preferred time is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitStatus({ type: 'error', message: 'Please fix the errors in the form' });
      return;
    }

    setLoading(true);
    setSubmitStatus(null);

    try {
      // Calculate age from date of birth
      const today = new Date();
      const birthDate = new Date(formData.date_of_birth);
      
      // Validate that the date is valid
      if (isNaN(birthDate.getTime())) {
        setSubmitStatus({
          type: 'error',
          message: 'Invalid date of birth. Please enter a valid date.'
        });
        setLoading(false);
        return;
      }

      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Ensure age is valid (between 0 and 150)
      if (age < 0 || age > 150) {
        setSubmitStatus({
          type: 'error',
          message: 'Invalid date of birth. Please check the date you entered.'
        });
        setLoading(false);
        return;
      }

      // Transform data to match API expectations
      const   apiData = {
        patient_name: `${formData.first_name} ${formData.last_name}`.trim(),
        gender: formData.gender,
        age: age,
        phone: formData.phone,
        email: formData.email || '',
        diagnosis_history: formData.medical_history || '',
        reason_for_visit: formData.diagnosis || 'General consultation',
        location_id: parseInt(formData.location_id),
        provider_id: formData.provider_id ? parseInt(formData.provider_id) : null,
        preferred_date: formData.requested_date,
        preferred_time: formData.requested_time
      };

      console.log('Form Data:', formData);
      console.log('Calculated Age:', age);
      console.log('API Data being sent:', apiData);

      // Validate required fields before sending (age can be 0 for infants, so check for undefined/null/NaN)
      if (!apiData.patient_name || !apiData.gender || apiData.age === undefined || 
          isNaN(apiData.age) || !apiData.phone || 
          !apiData.reason_for_visit || !apiData.location_id || 
          !apiData.preferred_date || !apiData.preferred_time) {
        console.error('Validation failed:', {
          patient_name: apiData.patient_name,
          gender: apiData.gender,
          age: apiData.age,
          phone: apiData.phone,
          reason_for_visit: apiData.reason_for_visit,
          location_id: apiData.location_id,
          preferred_date: apiData.preferred_date,
          preferred_time: apiData.preferred_time
        });
        setSubmitStatus({
          type: 'error',
          message: 'Please fill in all required fields correctly. Check that all fields marked with * are filled.'
        });
        setLoading(false);
        return;
      }

      // Submit to PUBLIC endpoint (no auth headers required)
      const response = await axios.post(`${API_BASE_URL}/AppointmentRequest`, apiData);
      
      if (response.data && response.data.statusCode === 201) {
        setSubmitStatus({
          type: 'success',
          message: 'Your appointment request has been submitted successfully! We will contact you shortly to confirm.'
        });
        
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          date_of_birth: '',
          gender: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          medical_history: '',
          diagnosis: '',
          location_id: '',
          provider_id: '',
          requested_date: '',
          requested_time: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error submitting appointment request:', error);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit appointment request. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-appointment-form">
      <div className="form-header">
        <h1>Book an Appointment</h1>
        <p>Fill out the form below and we'll get back to you shortly to confirm your appointment.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Personal Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="first_name">First Name *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={errors.first_name ? 'error' : ''}
              />
              {errors.first_name && <span className="error-text">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={errors.last_name ? 'error' : ''}
              />
              {errors.last_name && <span className="error-text">{errors.last_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="555-0123"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth *</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className={errors.date_of_birth ? 'error' : ''}
              />
              {errors.date_of_birth && <span className="error-text">{errors.date_of_birth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={errors.gender ? 'error' : ''}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Address (Optional)</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="address">Street Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                maxLength="2"
                placeholder="CA"
              />
            </div>

            <div className="form-group">
              <label htmlFor="zip_code">Zip Code</label>
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                maxLength="10"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Medical Information</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="diagnosis">Reason for Visit / Chief Complaint *</label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows="3"
                placeholder="e.g., Toothache, Routine checkup, Cavity filling"
                className={errors.diagnosis ? 'error' : ''}
              />
              {errors.diagnosis && <span className="error-text">{errors.diagnosis}</span>}
            </div>

            <div className="form-group full-width">
              <label htmlFor="medical_history">Medical History (Optional)</label>
              <textarea
                id="medical_history"
                name="medical_history"
                value={formData.medical_history}
                onChange={handleChange}
                rows="3"
                placeholder="Any allergies, current medications, or medical conditions we should know about"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Appointment Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="location_id">Preferred Location *</label>
              <select
                id="location_id"
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                className={errors.location_id ? 'error' : ''}
              >
                <option value="">Select a location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {location.city}
                  </option>
                ))}
              </select>
              {errors.location_id && <span className="error-text">{errors.location_id}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="provider_id">Select Provider *</label>
              <select
                id="provider_id"
                name="provider_id"
                value={formData.provider_id}
                onChange={handleChange}
                disabled={!formData.location_id}
                className={errors.provider_id ? 'error' : ''}
              >
                {filteredProviders.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    Dr. {provider.first_name} {provider.last_name} - {provider.specialization}
                  </option>
                ))}
              </select>
              {errors.provider_id && <span className="error-text">{errors.provider_id}</span>}
            </div>

            <div className="form-group full-width">
              <label htmlFor="requested_date">Preferred Date *</label>
              {!formData.provider_id ? (
                <div className="info-text" style={{ padding: '20px', textAlign: 'center' }}>
                  📅 Please select a provider first to see available dates
                </div>
              ) : loadingDates ? (
                <div className="info-text" style={{ padding: '20px', textAlign: 'center' }}>
                  Loading available dates...
                </div>
              ) : (
                <>
                  <DatePicker
                    selected={formData.requested_date ? new Date(formData.requested_date) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toISOString().split('T')[0] : '';
                      setFormData(prev => ({ ...prev, requested_date: dateStr }));
                      if (errors.requested_date) {
                        setErrors(prev => ({ ...prev, requested_date: '' }));
                      }
                    }}
                    minDate={new Date()}
                    maxDate={(() => {
                      const maxDate = new Date();
                      maxDate.setDate(maxDate.getDate() + 60);
                      return maxDate;
                    })()}
                    filterDate={(date) => {
                      if (availableDates.size === 0) return true; // Show all dates if not loaded yet
                      // Use local date to avoid timezone issues
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      return availableDates.has(dateStr);
                    }}
                    placeholderText="Select a date"
                    dateFormat="MMMM d, yyyy"
                    inline
                    className={errors.requested_date ? 'error' : ''}
                    calendarClassName="appointment-calendar"
                  />
                  {formData.requested_date && availableDates.size > 0 && 
                   !availableDates.has(formData.requested_date) && (
                    <small className="warning-text" style={{ marginTop: '8px', display: 'block' }}>
                      ⚠️ No available slots for this date. Please select another date.
                    </small>
                  )}
                  {availableDates.size > 0 && (
                    <small className="help-text" style={{ display: 'block', marginTop: '8px' }}>
                      📅 {availableDates.size} dates with available slots in the next 60 days (greyed out dates are unavailable)
                    </small>
                  )}
                </>
              )}
              {errors.requested_date && <span className="error-text">{errors.requested_date}</span>}
            </div>

            <div className="form-group full-width">
              <label>Preferred Time *</label>
              {!formData.provider_id || !formData.requested_date ? (
                <p className="info-text">Please select a provider and date first to see available time slots</p>
              ) : loadingSlots ? (
                <p className="info-text">Loading available slots...</p>
              ) : availableSlots.length === 0 ? (
                <p className="warning-text">⚠️ No slots available for this date. The provider is not working on this day or all slots are fully booked.</p>
              ) : (() => {
                  const hasAnyAvailable = availableSlots.some(slot => 
                    typeof slot === 'string' ? true : slot.available
                  );
                  return (
                    <>
                      {!hasAnyAvailable && (
                        <p className="warning-text" style={{ marginBottom: '12px' }}>
                          ⚠️ All slots are booked for this date. Please select another date.
                        </p>
                      )}
                      <div className="time-slots-grid">
                        {availableSlots.map(slot => {
                          const slotTime = typeof slot === 'string' ? slot : slot.time;
                          const isAvailable = typeof slot === 'string' ? true : slot.available;
                          const isPast = typeof slot === 'object' && slot.isPast;
                          const displayTime = slotTime.substring(0, 5);
                          
                          let title = 'Click to select this time';
                          if (isPast) {
                            title = 'This time has passed';
                          } else if (!isAvailable) {
                            title = 'This slot is already booked';
                          }
                          
                          return (
                            <button
                              key={slotTime}
                              type="button"
                              className={`time-slot-btn ${formData.requested_time === slotTime ? 'selected' : ''} ${!isAvailable ? (isPast ? 'past' : 'booked') : ''}`}
                              onClick={() => isAvailable && setFormData(prev => ({ ...prev, requested_time: slotTime }))}
                              disabled={!isAvailable}
                              title={title}
                            >
                              {displayTime}
                              {isPast && <span className="booked-indicator"> ⏱</span>}
                              {!isAvailable && !isPast && <span className="booked-indicator"> ✕</span>}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()
              }
              {errors.requested_time && <span className="error-text">{errors.requested_time}</span>}
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Additional Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any special requests or information we should know"
              />
            </div>
          </div>
        </div>

        {submitStatus && (
          <div className={`status-message ${submitStatus.type}`}>
            {submitStatus.message}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Appointment Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PublicAppointmentForm;
