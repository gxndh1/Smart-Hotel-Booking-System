import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateManagerRoom } from '../../../redux/managerSlice';
import { FaTrash, FaEdit, FaBed, FaMoneyBillWave, FaUsers, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';


// DEFINIG THE STATES OF THE ROOMS
const RoomTable = ({ rooms = [], allHotels = [], managerHotels = [], onDelete }) => {
    const dispatch = useDispatch();
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [roomType, setRoomType] = useState('');
    const [roomPrice, setRoomPrice] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);

    // GETTING THE HOTELS
    const hotels = managerHotels.length > 0 ? managerHotels : allHotels;

    // GETTING THE HOTEL NAME
    const getHotelName = (hotel) => {
        if (!hotel) return 'N/A';
        if (typeof hotel === 'string') {
            const foundHotel = hotels.find(h => h._id === hotel || h.id === hotel);
            return foundHotel?.name || foundHotel?.Name || 'Unknown Hotel';
        }
        return hotel.name || hotel.Name || 'Unknown Hotel';
    };


    // FILLING ROOM FORM
    const startEdit = (room) => {
        setEditingRoomId(room._id);
        setRoomType(room.type || room.Type || '');
        setRoomPrice(room.price?.toString() || room.Price?.toString() || '');
        setIsAvailable(room.availability === true || room.Availability === true);
    };

    const saveEdit = (room) => {
        const price = parseFloat(roomPrice);
        if (!roomPrice || price <= 0) {
            alert('Please enter a valid price');
            return;
        }

        dispatch(updateManagerRoom({ 
            roomId: room._id, 
            roomData: { type: roomType, price, availability: isAvailable } 
        }))
        .unwrap()
        .then(() => {
            alert('Room updated successfully!');
            setEditingRoomId(null);
        })
        .catch((err) => alert(err.message || 'Failed to update room'));
    };

    if (rooms.length === 0) {
        return <div className="text-center py-5 text-muted">No rooms found. Add one to get started!</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-hover align-middle">
                <thead className="table-light">
                    <tr>
                        <th className="ps-4">Hotel</th>
                        <th>Room Type</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Capacity</th>
                        <th className="text-end pe-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rooms.map(room => (
                        <tr key={room._id}>
                            {editingRoomId === room._id ? (
                                <td colSpan="6" className="p-3 bg-light">
                                    <div className="row g-3 align-items-end">
                                        <div className="col-md-3">
                                            <label className="form-label small fw-bold">Type</label>
                                            <input type="text" className="form-control form-control-sm" value={roomType} onChange={(e) => setRoomType(e.target.value)} />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">Price (₹)</label>
                                            <input type="number" className="form-control form-control-sm" value={roomPrice} onChange={(e) => setRoomPrice(e.target.value)} />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small fw-bold">Status</label>
                                            <select className="form-select form-select-sm" value={isAvailable} onChange={(e) => setIsAvailable(e.target.value === 'true')}>
                                                <option value="true">Available</option>
                                                <option value="false">Unavailable</option>
                                            </select>
                                        </div>
                                        <div className="col-md-5 text-end">
                                            <button className="btn btn-sm btn-success me-2" onClick={() => saveEdit(room)}>Save</button>
                                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingRoomId(null)}>Cancel</button>
                                        </div>
                                    </div>
                                </td>
                            ) : (
                                <>
                                    <td className="ps-4 fw-bold">{getHotelName(room.hotelId || room.HotelID)}</td>
                                    <td><FaBed className="me-2 text-primary"/>{room.type || room.Type}</td>
                                    <td><FaMoneyBillWave className="me-2 text-success"/>₹{(room.price || room.Price)?.toLocaleString()}</td>
                                    <td>
                                        {(room.availability || room.Availability) ? (
                                            <span className="badge bg-success-subtle text-success"><FaCheckCircle className="me-1"/> Available</span>
                                        ) : (
                                            <span className="badge bg-danger-subtle text-danger"><FaTimesCircle className="me-1"/> Unavailable</span>
                                        )}
                                    </td>
                                    <td><FaUsers className="me-2 text-info"/>{room.capacity || room.Capacity}</td>
                                    <td className="text-end pe-4">
                                        <div className="btn-group btn-group-sm">
                                            <button className="btn btn-outline-primary" onClick={() => startEdit(room)} title="Edit Room">
                                                <FaEdit />
                                            </button>
                                            <button className="btn btn-outline-danger" onClick={() => onDelete(room._id)} title="Delete Room">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RoomTable;