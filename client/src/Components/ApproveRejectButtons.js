import React, { useEffect } from 'react';

export default function ApproveRejectButtons({
  onApprove,
  onReject,
  disabledApprove,
  disabledReject,
  loadingApprove,
  loadingReject,
  className,
  size = 'md'
}) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const styleBtn = { width: dim, height: dim, padding: 0 };
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
  return (
    <div className={`approval-stack ${className || ''}`.trim()}>
      <button
        type="button"
        className="btn btn-primary"
        style={styleBtn}
        onClick={onApprove}
        disabled={disabledApprove || loadingApprove}
        title="Approve"
      >
        {loadingApprove ? (
          <span className="spinner-border spinner-border-sm" role="status"></span>
        ) : (
          <i data-lucide="thumbs-up"></i>
        )}
      </button>
      <button
        type="button"
        className="btn btn-danger"
        style={styleBtn}
        onClick={onReject}
        disabled={disabledReject || loadingReject}
        title="Reject"
      >
        {loadingReject ? (
          <span className="spinner-border spinner-border-sm" role="status"></span>
        ) : (
          <i data-lucide="thumbs-down"></i>
        )}
      </button>
    </div>
  );
}
