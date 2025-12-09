import React, { useMemo, useState } from 'react';

export default function AutocompleteInput({
  label,
  placeholder,
  value,
  onChange,
  suggestions,
  className = 'form-control bg-body text-body'
}) {
  const [show, setShow] = useState(false);

  const filtered = useMemo(() => {
    const v = (value || '').toLowerCase();
    const uniq = Array.from(new Set((suggestions || []).filter(Boolean)));
    if (!v) return uniq.slice(0, 10);
    return uniq.filter((s) => String(s).toLowerCase().includes(v)).slice(0, 10);
  }, [value, suggestions]);

  return (
    <div className="mb-3">
      {label && <label className="form-label fw-normal">{label}</label>}
      <div className="position-relative">
        <input
          type="text"
          className={className}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 200)}
        />
        {show && filtered.length > 0 && (
          <ul className="dropdown-menu show w-100">
            {filtered.map((s, idx) => (
              <li key={idx}>
                <button
                  className="dropdown-item"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onChange(String(s))}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
