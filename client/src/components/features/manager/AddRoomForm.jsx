import React, { useState } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { createManagerRoom } from '../../../redux/managerSlice';

const AddRoomForm = ({ hotels, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hotelId: '',
    type: 'Standard',
    price: '',
    capacity: 2,
    features: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const roomData = {
        ...formData,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        features: formData.features.split(',').map(a => a.trim()).filter(a => a)
      };
      
      await dispatch(createManagerRoom(roomData)).unwrap();
      alert('Room added successfully!');
      onSuccess();
    } catch (err) {
      alert(err.message || 'Failed to add room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 rounded-4 shadow">
          <div className="modal-header border-0 p-4 pb-0">
            <h5 className="modal-title fw-bold">Add New Room</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-bold">Select Hotel</label>
                <select 
                  className="form-select rounded-3" 
                  required 
                  value={formData.hotelId}
                  onChange={(e) => setFormData({...formData, hotelId: e.target.value})}
                >
                  <option value="">-- Choose Hotel --</option>
                  {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                </select>
              </div>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Room Type</label>
                  <select 
                    className="form-select rounded-3" 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Price per Night (₹)</label>
                  <input 
                    type="number" 
                    className="form-control rounded-3" 
                    required 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Capacity (Persons)</label>
                <input 
                  type="number" 
                  className="form-control rounded-3" 
                  required 
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Features (comma separated)</label>
                <input 
                  type="text" 
                  className="form-control rounded-3" 
                  placeholder="WiFi, AC, TV, Mini Bar"
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-3 rounded-3 fw-bold mt-3" disabled={loading}>
                {loading ? 'Adding...' : <><FaPlus className="me-2"/> Add Room</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRoomForm;