import React from 'react';
import { FaBuilding } from 'react-icons/fa';
import HotelTable from '../../common/tables/HotelTable';


const ManagerHotelSection = ({ hotels, onAddHotel, onDeleteHotel }) => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">My Hotels ({hotels.length})</h4>
        <button className="btn btn-primary" onClick={onAddHotel}>
          <FaBuilding className="me-2" /> Add Hotel
        </button>
      </div>
      <HotelTable hotels={hotels} onDelete={onDeleteHotel} isManager={true} />
    </>
  );
};

export default ManagerHotelSection;