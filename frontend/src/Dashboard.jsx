import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMeetings, createMeeting, deleteMeeting } from './api';
import { useDebounce } from './hooks/useDebounce';

export default function Dashboard({ onSelectMeeting }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Load meetings with error handling
  const loadMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMeetings();
      setMeetings(data);
    } catch (err) {
      setError(`❌ ${err.message || 'Failed to load meetings'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // Filter meetings by search term (performance: useMemo)
  const filteredMeetings = useMemo(() => {
    if (!debouncedSearch) return meetings;
    const searchLower = debouncedSearch.toLowerCase();
    return meetings.filter(m => 
      m.title.toLowerCase().includes(searchLower) ||
      (m.transcript && m.transcript.toLowerCase().includes(searchLower))
    );
  }, [meetings, debouncedSearch]);

  // Handle create meeting
  const handleCreateMeeting = useCallback(async () => {
    const trimmedTitle = newTitle.trim();
    
    if (!trimmedTitle) {
      setError('❌ Please enter a meeting title');
      return;
    }
    
    if (trimmedTitle.length > 100) {
      setError('❌ Meeting title must be less than 100 characters');
      return;
    }

    setError('');
    setSuccess('');
    setIsCreating(true);
    
    try {
      const meeting = await createMeeting(trimmedTitle);
      setMeetings(prev => [meeting, ...prev]);
      setNewTitle('');
      setSuccess(`✅ "${meeting.title}" created successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
      if (onSelectMeeting && meeting._id) {
        onSelectMeeting(meeting._id);
      }
    } catch (err) {
      setError(`❌ ${err.message || 'Failed to create meeting'}`);
    } finally {
      setIsCreating(false);
    }
  }, [newTitle, onSelectMeeting]);

  // Handle delete meeting
  const handleDeleteMeeting = useCallback(async (id, title, e) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setIsDeleting(id);
    setError('');
    
    try {
      await deleteMeeting(id);
      setMeetings(prev => prev.filter(m => m._id !== id));
      setSuccess(`✅ "${title}" deleted successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`❌ ${err.message || 'Failed to delete meeting'}`);
    } finally {
      setIsDeleting(null);
    }
  }, []);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleCreateMeeting();
    }
  }, [handleCreateMeeting]);

  // Format date (performance: memoize)
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <div className="animated-bg-light py-8 px-4 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="glass-light inline-block rounded-2xl px-10 py-6 shadow-sm">
            <h1 className="text-4xl md:text-5xl font-bold text-[#5C4033]">
              📝 Meeting Notes
            </h1>
            <p className="text-[#8B7355] mt-2 text-lg font-light">
              AI-powered meeting transcription & summarization
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-[#e8f5e9] border border-[#81c784] text-[#2e7d32] rounded-xl">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[#fdf2f2] border border-[#f5c6c6] text-[#c0392b] rounded-xl">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-3 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Create Meeting Card */}
        <div className="card p-8 mb-8">
          <h2 className="text-xl font-semibold text-[#5C4033] mb-4">
            ✨ Create New Meeting
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter meeting title (max 100 chars)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              className="input-field"
              disabled={isCreating}
              maxLength={100}
            />
            <button
              onClick={handleCreateMeeting}
              disabled={isCreating}
              className={`btn-primary text-lg whitespace-nowrap ${
                isCreating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCreating ? '⏳ Creating...' : '➕ New Meeting'}
            </button>
          </div>
          <div className="mt-2 text-sm text-[#b8a088]">
            {newTitle.length}/100 characters
          </div>
        </div>

        {/* Search & Meeting List */}
        <div className="card p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-[#5C4033]">
              📋 Your Meetings
              <span className="text-sm font-normal text-[#8B7355] ml-2">
                ({filteredMeetings.length} total)
              </span>
            </h2>
            <input
              type="text"
              placeholder="🔍 Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field max-w-xs"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto"></div>
              <p className="text-[#8B7355] mt-4">Loading your meetings...</p>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-16 bg-[#faf8f5] rounded-xl">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-2xl font-medium text-[#8B7355]">
                {searchTerm ? 'No meetings match your search' : 'No meetings yet'}
              </p>
              <p className="text-[#b8a088] mt-2">
                {searchTerm ? 'Try a different search term' : 'Create your first meeting above!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMeetings.map((meeting) => (
                <div
                  key={meeting._id}
                  onClick={() => onSelectMeeting(meeting._id)}
                  className="bg-[#faf8f5] rounded-xl p-6 hover:bg-[#f5f0e8] cursor-pointer border-2 border-transparent hover:border-[#E8C872] transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#5C4033] mb-2 truncate">
                        {meeting.title}
                      </h3>
                      <p className="text-sm text-[#8B7355]">
                        📅 {formatDate(meeting.createdAt)}
                      </p>
                      {meeting.transcript && (
                        <p className="text-sm text-[#7BAE7F] mt-2">
                          📝 {meeting.transcript.length} characters
                        </p>
                      )}
                      {meeting.summary && (
                        <p className="text-sm text-[#8B7355] mt-1 line-clamp-2">
                          ✨ {meeting.summary.substring(0, 80)}...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-[#D4A373] text-2xl group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                      <button
                        onClick={(e) => handleDeleteMeeting(meeting._id, meeting.title, e)}
                        disabled={isDeleting === meeting._id}
                        className="text-[#c0392b] hover:text-[#a93226] text-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isDeleting === meeting._id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-[#b8a088] text-sm">
          <p>Built with ❤️ using React, Node.js, and AI</p>
        </div>
      </div>
    </div>
  );
}