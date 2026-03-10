import React from 'react';
import { FaTrash } from 'react-icons/fa';

const AdminReviewSection = ({ reviews, onDelete }) => {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No reviews found</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th>Hotel</th>
            <th>User</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date</th>
            <th className="text-end pe-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review._id}>
              <td className="fw-bold">{review.hotelName}</td>
              <td>{review.userName}</td>
              <td>
                <span className="badge bg-warning text-dark">
                  {"★".repeat(review.rating || 0)} {review.rating || 0}
                </span>
              </td>
              <td className="text-muted small" style={{ maxWidth: "300px" }}>
                {review.comment?.substring(0, 80) || "No comment"}...
              </td>
              <td className="text-muted small">
                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "N/A"}
              </td>
              <td className="text-end pe-3">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(review._id)}
                  title="Delete review"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminReviewSection;