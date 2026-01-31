import React from 'react';

export default function ApproveRejectButtons({
  onApprove,
  onReject,
  disabledApprove,
  disabledReject,
  loadingApprove,
  loadingReject,
  className,
  size = 'md',
}) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const styleBtn = { width: dim, height: dim, padding: 0 };
  return (
    <div className={`d-flex gap-2 ${className || ''}`.trim()}>
      <button
        type="button"
        className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center"
        onClick={onApprove}
        disabled={disabledApprove || loadingApprove}
        title="Approve"
        style={styleBtn}
      >
        {loadingApprove ? (
          <span className="spinner-border spinner-border-sm" role="status"></span>
        ) : (
          <span style={{ fontSize: 16, lineHeight: 1 }}>✓</span>
        )}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
        onClick={onReject}
        disabled={disabledReject || loadingReject}
        title="Reject"
        style={styleBtn}
      >
        {loadingReject ? (
          <span className="spinner-border spinner-border-sm" role="status"></span>
        ) : (
          <span style={{ fontSize: 16, lineHeight: 1 }}>✕</span>
        )}
      </button>
    </div>
  );
}
