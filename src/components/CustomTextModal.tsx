import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';

interface CustomTextModalProps {
  initialText: string;
  onSave: (text: string) => void;
  onClose: () => void;
}

export const CustomTextModal: React.FC<CustomTextModalProps> = ({
  initialText,
  onSave,
  onClose
}) => {
  const [text, setText] = useState(initialText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text.trim());
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sliders size={20} color="var(--color-accent)" />
            <span>Custom Text Practice</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">
              Paste or type custom sentences / code snippets:
            </label>
            <textarea
              className="form-input"
              style={{ minHeight: '160px', resize: 'vertical' }}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste text here..."
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Apply Custom Text</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
