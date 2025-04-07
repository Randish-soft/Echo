// fe/src/SignedUp/ProgressModal.tsx
import React, { useState, useEffect } from 'react';

interface ProgressModalProps {
  isVisible: boolean;   // Whether to show/hide the modal overlay
  isComplete: boolean;  // Whether the process is 100% complete
  onClose?: () => void; // Called when user clicks “Close”
}

const ProgressModal: React.FC<ProgressModalProps> = ({ isVisible, isComplete, onClose }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset to 0% if the modal is hidden
    if (!isVisible) {
      setProgress(0);
      return;
    }

    // If visible, increment progress from 0% up to ~90%,
    // then let isComplete jump it to 100%
    const timer = setInterval(() => {
      setProgress((prev) => {
        // If we've reached 90 or the process is complete, stop
        if (prev >= 90 || isComplete) {
          return prev;
        }
        return prev + 5; // increment by 5% steps
      });
    }, 600); // every 0.6s
    return () => clearInterval(timer);
  }, [isVisible, isComplete]);

  // If the parent sets isComplete, jump progress to 100% immediately
  useEffect(() => {
    if (isComplete) {
      setProgress(100);
    }
  }, [isComplete]);

  if (!isVisible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ textAlign: 'center' }}>Analyzing Repo...</h3>
        <div style={styles.barContainer}>
          <div style={{ ...styles.barFill, width: `${progress}%` }} />
        </div>
        <p style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          {progress}% complete
        </p>

        {isComplete && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={styles.closeButton}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline styling for simplicity
const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    width: '300px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  barContainer: {
    width: '100%',
    height: '20px',
    backgroundColor: '#ccc',
    borderRadius: '10px',
    overflow: 'hidden',
    marginTop: '1rem',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    transition: 'width 0.4s ease',
  },
  closeButton: {
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default ProgressModal;
