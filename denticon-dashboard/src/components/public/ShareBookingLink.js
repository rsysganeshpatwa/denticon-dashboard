import React, { useState } from 'react';
import './ShareBookingLink.css';

function ShareBookingLink() {
  const [copied, setCopied] = useState(false);
  const bookingUrl = `${window.location.origin}/book-appointment`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Book your dental appointment online: ${bookingUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Book Your Dental Appointment');
    const body = encodeURIComponent(`Hello,\n\nYou can now book your dental appointment online at:\n${bookingUrl}\n\nNo login required - just fill out the form and we'll get back to you shortly!\n\nBest regards,\nDenticon Dental Clinic`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const downloadQRCode = () => {
    // Generate QR code using a free API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bookingUrl)}`;
    window.open(qrUrl, '_blank');
  };

  return (
    <div className="share-booking-link">
      <div className="share-header">
        <div className="share-icon">🌐</div>
        <h2>Share Public Booking Link</h2>
        <p>Share this link with patients to book appointments online</p>
      </div>

      <div className="link-display">
        <div className="link-box">
          <input 
            type="text" 
            value={bookingUrl} 
            readOnly 
            className="link-input"
            onClick={(e) => e.target.select()}
          />
          <button className="copy-btn" onClick={copyToClipboard}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        {copied && (
          <div className="success-notification">
            ✅ Link copied to clipboard!
          </div>
        )}
      </div>

      <div className="share-options">
        <h3>Quick Share Options:</h3>
        <div className="share-buttons">
          <button className="share-btn whatsapp" onClick={shareViaWhatsApp}>
            <span className="btn-icon">💬</span>
            <div className="btn-content">
              <strong>WhatsApp</strong>
              <small>Share via message</small>
            </div>
          </button>

          <button className="share-btn email" onClick={shareViaEmail}>
            <span className="btn-icon">📧</span>
            <div className="btn-content">
              <strong>Email</strong>
              <small>Send via email</small>
            </div>
          </button>

          <button className="share-btn qr" onClick={downloadQRCode}>
            <span className="btn-icon">📱</span>
            <div className="btn-content">
              <strong>QR Code</strong>
              <small>Download QR code</small>
            </div>
          </button>

          <a 
            href={bookingUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="share-btn preview"
          >
            <span className="btn-icon">👁️</span>
            <div className="btn-content">
              <strong>Preview</strong>
              <small>Open in new tab</small>
            </div>
          </a>
        </div>
      </div>

      <div className="share-tips">
        <h3>💡 Sharing Tips:</h3>
        <ul>
          <li><strong>Website:</strong> Add this link as a "Book Appointment" button on your website</li>
          <li><strong>Social Media:</strong> Post on Facebook, Instagram, or Twitter</li>
          <li><strong>SMS/WhatsApp:</strong> Send directly to patients</li>
          <li><strong>Email Signature:</strong> Include in your email signature</li>
          <li><strong>Print Materials:</strong> Add QR code to business cards, flyers, or posters</li>
          <li><strong>Google Business:</strong> Add to your Google My Business profile</li>
        </ul>
      </div>

      <div className="stats-preview">
        <h3>📊 What Patients Can Do:</h3>
        <div className="feature-grid">
          <div className="feature-item">
            <span className="feature-icon">✍️</span>
            <div>
              <strong>Fill Personal Info</strong>
              <p>Name, contact, date of birth</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📍</span>
            <div>
              <strong>Choose Location</strong>
              <p>Select preferred clinic branch</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👨‍⚕️</span>
            <div>
              <strong>Select Provider</strong>
              <p>Optional - auto-assigns if not chosen</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📅</span>
            <div>
              <strong>Pick Date & Time</strong>
              <p>Choose preferred appointment slot</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-note">
        <strong>Note:</strong> All appointment requests will appear in the "Appointment Requests" 
        section where you can approve or reject them.
      </div>
    </div>
  );
}

export default ShareBookingLink;
