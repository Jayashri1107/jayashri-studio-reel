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
      <div className={`modal-portal modal-portal-${size}`} role="dialog" aria-modal="true">
        <div className="modal-portal-header">
          <h5 className="modal-title mb-0">Video</h5>
        </div>
        <div className="modal-portal-body">
          <video
            src={videoUrl}
            autoPlay
            muted
            playsInline
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            className={`modal-video modal-video-${size}`}
          />
        </div>
      </div>
    </>
  );
}
