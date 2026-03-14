import React from 'react';
import ManagerBookingTable from './ManagerBookingTable';

const ManagerBookingSection = ({ bookings, onApprove, onReject }) => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Hotel Bookings ({bookings.length})</h4>
      </div>
      {/* BOOKING TABLE */}
      <ManagerBookingTable 
        bookings={bookings} 
        onApprove={onApprove} 
        onReject={onReject} 
      />
    </>
  );
};

export default ManagerBookingSection;