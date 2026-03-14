```javascript
import React from 'react';
import ManagerReviewTable from './ManagerReviewTable';

const ManagerReviewSection = ({ reviews, onReply }) => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Hotel Reviews ({reviews.length})</h4>
      </div>
      {/* REVIEW TABLE */}
      <ManagerReviewTable 
        reviews={reviews} 
        onReply={onReply}
      />
    </>
  );
};

export default ManagerReviewSection;
```