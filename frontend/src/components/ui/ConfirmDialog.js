import { useCallback, useEffect, useRef } from 'react';

/**
 * In-app replacement for window.confirm.
 *
 * Reuses the existing .modal-* classes so it picks up the workspace theme,
 * and adds alertdialog semantics, Escape-to-cancel and focus restoration —
 * none of which the native dialog gave us control over.
 */
const ConfirmDialog = ({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  destructive = true,
  onConfirm,
  onCancel
}) => {
  const cancelRef = useRef(null);
  const previouslyFocused = useRef(null);

  const handleCancel = useCallback(() => {
    if (!busy) onCancel();
  }, [busy, onCancel]);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    cancelRef.current?.focus();

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        handleCancel();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // put focus back where it was so the rail stays keyboard-navigable
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, handleCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div
        className="modal-content confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="confirm-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p id="confirm-body" className="confirm-body">{body}</p>
        </div>
        <div className="modal-footer">
          <button className="btn" ref={cancelRef} onClick={handleCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${destructive ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <><span className="loading-spinner" />Working…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
