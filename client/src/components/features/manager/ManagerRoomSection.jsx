import React from 'react';
import { FaPlus } from 'react-icons/fa';
import RoomTable from './RoomTable';

const ManagerRoomSection = ({ rooms, hotels, onAddRoom, onDeleteRoom }) => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">My Rooms ({rooms.length})</h4>
        <button className="btn btn-primary" onClick={onAddRoom}>
          <FaPlus className="me-2" /> Add Room
        </button>
      </div>
      <RoomTable 
        rooms={rooms} 
        onDelete={onDeleteRoom} 
        managerHotels={hotels}
      />
    </>
  );
};

export default ManagerRoomSection;