import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaBed } from 'react-icons/fa';

const EditBookingModal = ({ booking, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    checkInDate: new Date(booking.checkInDate).toISOString().split('T')[0],
    checkOutDate: new Date(booking.checkOutDate).toISOString().split('T')[0],
    numberOfRooms: booking.numberOfRooms,
    status: booking.status
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(booking._id, formData);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold">Modify Booking</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold mb-1">Status</label>
                <select 
                  className="form-select" 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold mb-1"><FaCalendarAlt className="me-1"/> Check-in Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="checkInDate" 
                    value={formData.checkInDate} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="col-md-6 mt-3 mt-md-0">
                  <label className="form-label text-muted small fw-bold mb-1"><FaCalendarAlt className="me-1"/> Check-out Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="checkOutDate" 
                    value={formData.checkOutDate} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-bold mb-1"><FaBed className="me-1"/> Number of Rooms</label>
                <input 
                  type="number" 
                  className="form-control" 
                  name="numberOfRooms" 
                  min="1"
                  value={formData.numberOfRooms} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light rounded-3 px-4" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-3 px-4">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;
