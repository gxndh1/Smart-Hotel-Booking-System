import React, { useState } from 'react';
import { FaStar, FaReply, FaTrash, FaUser, FaEdit } from 'react-icons/fa';


// REVIEW TABLE
const ManagerReviewTable = ({ reviews = [], onReply }) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // REPLY FN
  const handleReplySubmit = (reviewId) => {
    if (!replyText.trim()) return;
    onReply(reviewId, replyText);
    setReplyingTo(null);
    setReplyText('');
  };

  const handleEditClick = (review) => {
    setReplyingTo(review._id);
    setReplyText(review.managerReply || '');
  };

  // NO REVIEWS
  if (reviews.length === 0) {
    return <div className="text-center py-5 text-muted">No reviews found for your hotels.</div>;
  }

  // REVIEW TABLE
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th className="ps-4">Hotel & Guest</th>
            <th>Rating & Comment</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map(review => (
            <tr key={review._id}>
              <td className="ps-4">
                <div className="fw-bold">{review.hotelName}</div>
                <div className="small text-muted"><FaUser className="me-1"/> {review.userName}</div>
              </td>
              <td>
                <div className="text-warning mb-1">
                  {[...Array(5)].map((_, i) => <FaStar key={i} className={i < review.rating ? "" : "text-light"} />)}
                </div>
                <div className="small text-dark text-truncate" style={{maxWidth: '200px'}} title={review.comment}>
                  {review.comment}
                </div>
              </td>
              <td>
                {replyingTo === review._id ? (
                  <div className="input-group input-group-sm">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Write a reply..." 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={() => handleReplySubmit(review._id)}>
                      {review.managerReply ? 'Update' : 'Send'}
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</button>
                  </div>
                ) : review.managerReply ? (
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="small text-success italic">
                      <FaReply className="me-1"/> {review.managerReply}
                    </div>
                    <button className="btn btn-sm btn-link text-primary p-0 ms-2" onClick={() => handleEditClick(review)} title="Edit Reply">
                      <FaEdit />
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-link text-primary p-0" onClick={() => handleEditClick(review)}>Add Reply</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManagerReviewTable;