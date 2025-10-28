import React from 'react';
import './VideoModal.css';

const VideoModal = ({ videoUrl, onClose }) => {
  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="video-modal-close" onClick={onClose}>
          ✕
        </button>
        <div className="video-modal-player">
          <video controls autoPlay width="100%" height="100%">
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;

