import React, { useState, useEffect, useMemo } from 'react';

const InfluencerReelsFilters = ({ reels, onFilterChange }) => {
  const [influencerFilter, setInfluencerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [influencerSuggestions, setInfluencerSuggestions] = useState([]);
  const [showInfluencerSuggestions, setShowInfluencerSuggestions] = useState(false);

  // Extract unique influencer names and statuses from reels data
  const uniqueInfluencers = useMemo(() => {
    const influencers = [...new Set(reels.map(reel => reel.influencer).filter(Boolean))];
    return influencers.sort();
  }, [reels]);

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(reels.map(reel => reel.status).filter(Boolean))];
    return statuses.sort();
  }, [reels]);

  // Filter suggestions based on input
  useEffect(() => {
    if (influencerFilter) {
      const filtered = uniqueInfluencers.filter(influencer =>
        influencer.toLowerCase().includes(influencerFilter.toLowerCase())
      );
      setInfluencerSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setInfluencerSuggestions([]);
    }
  }, [influencerFilter, uniqueInfluencers]);

  // Remove auto-apply; filters apply only on button click

  const handleInfluencerSelect = (influencer) => {
    setInfluencerFilter(influencer);
    setShowInfluencerSuggestions(false);
  };

  const clearFilters = () => {
    setInfluencerFilter('');
    setStatusFilter('');
    onFilterChange({ influencer: '', status: '', date: '' });
  };

  const handleApplyFilters = () => {
    onFilterChange({
      influencer: influencerFilter.trim(),
      status: statusFilter.trim(),
      date: ''
    });
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  return (
    <div className="mb-4 p-3 bg-body-secondary rounded border">
      <div className="row g-3 align-items-end">
        <div className="col-md-4">
          <label className="form-label fw-semibold mb-2">Influencer Name</label>
          <div className="position-relative">
            <input
              type="text"
              className="form-control"
              placeholder="Search influencer..."
              value={influencerFilter}
              onChange={(e) => {
                setInfluencerFilter(e.target.value);
                setShowInfluencerSuggestions(true);
              }}
              onFocus={() => setShowInfluencerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowInfluencerSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
            />
            {showInfluencerSuggestions && influencerSuggestions.length > 0 && (
              <ul className="dropdown-menu show w-100" style={{zIndex: 1050}}>
                {influencerSuggestions.map((influencer, index) => (
                  <li key={index}>
                    <button
                      className="dropdown-item"
                      type="button"
                      onClick={() => handleInfluencerSelect(influencer)}
                    >
                      {influencer}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="col-md-3">
          <label className="form-label fw-semibold mb-2">Status</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div className="col-md-2 d-flex gap-2 align-items-end">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleApplyFilters}
          >
            <i data-lucide="filter" className="me-1" style={{width: '14px', height: '14px'}}></i>
            Apply
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
            <i data-lucide="x" className="me-1" style={{width: '14px', height: '14px'}}></i>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfluencerReelsFilters;
