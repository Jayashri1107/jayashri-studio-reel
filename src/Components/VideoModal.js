import { useEffect } from 'react';

export default function VideoModal({ show, videoUrl, products, brands, onClose, size = 'md' }) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;
  return (
    <>
      <div className="modal-portal-overlay" onClick={onClose} />
      <div className={`modal-portal modal-portal-${size}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-portal-header">
          <h5 className="modal-title mb-0">Video</h5>
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={onClose} 
            aria-label="Close"
            style={{ 
              fontSize: '1.5rem', 
              lineHeight: '1', 
              padding: '0.25rem 0.5rem',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        <div className="modal-portal-body" style={{ padding: 0 }}>
          <video
            src={videoUrl}
            autoPlay
            muted
            playsInline
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            className={`modal-video modal-video-${size}`}
            style={{ 
              width: '100%', 
              height: 'auto', 
              display: 'block',
              maxHeight: 'calc(85vh - 80px)'
            }}
          />
        </div>
      </div>
    </>
  );
}
