import React from 'react';
import HotelTable from '../../common/tables/HotelTable';


const AdminHotelSection = ({ hotels, onDelete }) => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Property Listings ({hotels.length})</h4>
      </div>
      <HotelTable hotels={hotels} onDelete={onDelete} isAdmin={true} />
    </>
  );
};

export default AdminHotelSection;