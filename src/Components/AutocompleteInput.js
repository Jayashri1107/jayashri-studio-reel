import React, { useMemo, useState, useRef } from 'react';

export default function AutocompleteInput({
  label,
  placeholder,
  value,
  onChange,
  suggestions,
  className = 'form-control',
  maxSuggestions = 10,
  keepOpenOnSelect = false,
  renderSuggestion
}) {
  const [show, setShow] = useState(false);
  const [recentSelectTs, setRecentSelectTs] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const v = (value || '').toLowerCase();
    const uniq = Array.from(new Set((suggestions || []).filter(Boolean)));
    if (!v) return uniq.slice(0, maxSuggestions);
    return uniq.filter((s) => String(s).toLowerCase().includes(v)).slice(0, maxSuggestions);
  }, [value, suggestions, maxSuggestions]);

  return (
    <div>
      {label && <label className="form-label fw-semibold mb-2">{label}</label>}
      <div className="position-relative">
        <input
          type="text"
          className={className}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShow(true)}
          onBlur={() => {
            if (keepOpenOnSelect && Date.now() - recentSelectTs < 500) return;
            setTimeout(() => setShow(false), 200);
          }}
          ref={inputRef}
        />
        {show && filtered.length > 0 && (
          <ul className="dropdown-menu show w-100" style={{zIndex: 1050}}>
            {filtered.map((s, idx) => (
              <li key={idx}>
                <button
                  className="dropdown-item"
                  type="button"
                  onClick={() => {
                    onChange(String(s));
                    if (keepOpenOnSelect) {
                      setShow(true);
                      setRecentSelectTs(Date.now());
                    } else {
                      setShow(false);
                      if (inputRef.current) {
                        inputRef.current.blur();
                      }
                    }
                  }}
                >
                  {renderSuggestion ? renderSuggestion(s) : s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
