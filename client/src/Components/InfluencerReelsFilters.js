import React, { useState, useEffect, useMemo } from 'react';

const InfluencerReelsFilters = ({ reels, onFilterChange }) => {
  const [influencerFilter, setInfluencerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
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
    setDateFilter('');
    onFilterChange({ influencer: '', status: '', date: '' });
  };

  const handleApplyFilters = () => {
    onFilterChange({
      influencer: influencerFilter.trim(),
      status: statusFilter.trim(),
      date: dateFilter
    });
  };

  return (
    <div className="row mb-3">
      <div className="col-md-5 mb-3">
        <label className="form-label fw-normal">Influencer Name</label>
        <div className="position-relative">
          <input
            type="text"
            className="form-control bg-body text-body"
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
            <ul className="dropdown-menu show w-100">
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
      
      <div className="col-md-3 mb-3">
        <label className="form-label fw-normal">Status</label>
        <select
          className="form-select bg-body text-body"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      <div className="col-md-2 mb-3">
        <label className="form-label fw-normal">Date Added</label>
        <input
          type="date"
          className="form-control bg-body text-body"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>
      <div className="col-md-2 mb-3 d-flex align-items-end justify-content-end gap-2">
        <button
          className="btn btn-primary"
          onClick={handleApplyFilters}
        >
          Apply
        </button>
        <button className="btn btn-outline-secondary" onClick={clearFilters}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default InfluencerReelsFilters;
