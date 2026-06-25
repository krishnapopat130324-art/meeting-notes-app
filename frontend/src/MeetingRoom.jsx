import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMeeting, updateMeeting, generateSummary } from './api';
import useSpeech from './useSpeech';
import { useDebounce } from './hooks/useDebounce';
import { io } from 'socket.io-client';

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [summary, setSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { transcript, isListening, startListening, stopListening, clearTranscript } = useSpeech();
  const [combinedTranscript, setCombinedTranscript] = useState('');
  const saveTimeout = useRef(null);
  const saveInProgress = useRef(false);

  // Debounce transcript for performance
  const debouncedTranscript = useDebounce(transcript, 200);

  // Update word count (performance: useMemo)
  const stats = useMemo(() => {
    const words = combinedTranscript.trim().split(/\s+/).filter(w => w.length > 0);
    const chars = combinedTranscript.length;
    const lines = combinedTranscript.split('\n').filter(l => l.trim()).length;
    return { words: words.length, chars, lines };
  }, [combinedTranscript]);

  // Load meeting with error handling
  const loadMeeting = useCallback(async () => {
    try {
      const data = await getMeeting(id);
      setMeeting(data);
      setCombinedTranscript(data.transcript || '');
      setSummary(data.summary || '');
      setError('');
    } catch (err) {
      console.error('Error loading meeting:', err);
      setError('❌ Failed to load meeting. Redirecting to dashboard...');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadMeeting();
  }, [loadMeeting]);

  // WebSocket connection
  useEffect(() => {
    let newSocket = null;
    try {
      newSocket = io('http://localhost:5000', {
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5
      });
      
      newSocket.on('connect', () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        newSocket.emit('join-room', id);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
      });

      newSocket.on('text-update', (content) => {
        setCombinedTranscript(content);
      });

      newSocket.on('error', (err) => {
        console.error('WebSocket error:', err);
        setError('⚠️ Real-time sync error: ' + (err.message || 'Connection issue'));
      });

      setSocket(newSocket);
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setError('⚠️ Real-time collaboration unavailable');
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [id]);

  // Update transcript with debounced value
  useEffect(() => {
    if (debouncedTranscript) {
      setCombinedTranscript(prev => {
        const newText = prev + ' ' + debouncedTranscript;
        return newText;
      });
    }
  }, [debouncedTranscript]);

  // Auto-save with debounce and error handling
  const handleSave = useCallback(async () => {
    if (saveInProgress.current || !meeting) return;
    
    saveInProgress.current = true;
    setIsSaving(true);
    setError('');
    
    try {
      await updateMeeting(id, {
        transcript: combinedTranscript,
        summary: summary
      });
      
      if (socket && isConnected) {
        socket.emit('text-change', { roomId: id, content: combinedTranscript });
      }
      
      setSuccess('💾 Auto-saved');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('❌ Auto-save failed: ' + (err.message || 'Please try again'));
    } finally {
      setIsSaving(false);
      saveInProgress.current = false;
    }
  }, [id, meeting, combinedTranscript, summary, socket, isConnected]);

  // Auto-save every 5 seconds (with cleanup)
  useEffect(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    
    saveTimeout.current = setTimeout(() => {
      if (combinedTranscript && meeting && !saveInProgress.current) {
        handleSave();
      }
    }, 5000);
    
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [combinedTranscript, meeting, handleSave]);

  // Generate AI summary with improved error handling
  const handleSummarize = useCallback(async () => {
    if (!combinedTranscript || combinedTranscript.length < 20) {
      setError('❌ Please record at least 20 characters of speech first.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const result = await generateSummary(combinedTranscript);
      if (result.summary) {
        setSummary(result.summary);
        setSuccess('✅ Summary generated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Auto-save after summary
        await updateMeeting(id, {
          transcript: combinedTranscript,
          summary: result.summary
        });
      } else {
        throw new Error('No summary received from AI');
      }
    } catch (err) {
      setError('❌ Failed to generate summary: ' + (err.message || 'Please try again'));
    } finally {
      setIsGenerating(false);
    }
  }, [combinedTranscript, id]);

  const handleClear = useCallback(() => {
    if (window.confirm('Clear all notes? This cannot be undone.')) {
      setCombinedTranscript('');
      clearTranscript();
      setSummary('');
      setError('');
      setSuccess('🗑️ Notes cleared');
      setTimeout(() => setSuccess(''), 2000);
    }
  }, [clearTranscript]);

  const handleCopyAll = useCallback(() => {
    const text = combinedTranscript + '\n\n--- Summary ---\n' + summary;
    navigator.clipboard.writeText(text)
      .then(() => {
        setSuccess('📋 Copied to clipboard!');
        setTimeout(() => setSuccess(''), 2000);
      })
      .catch(() => {
        setError('❌ Failed to copy to clipboard');
      });
  }, [combinedTranscript, summary]);

  const handleDownload = useCallback(() => {
    try {
      const element = document.createElement('a');
      const file = new Blob(
        [combinedTranscript + '\n\n--- Summary ---\n' + summary], 
        { type: 'text/plain' }
      );
      element.href = URL.createObjectURL(file);
      element.download = `${meeting?.title || 'meeting'}_notes.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
      setSuccess('📥 Downloaded successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('❌ Failed to download file');
    }
  }, [combinedTranscript, summary, meeting]);

  if (!meeting) {
    return (
      <div className="animated-bg-light flex items-center justify-center min-h-screen">
        <div className="card p-12 text-center">
          <div className="spinner mx-auto"></div>
          <p className="text-[#8B7355] mt-4">Loading meeting...</p>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="animated-bg-light min-h-screen">
      {/* Header */}
      <div className="glass-light border-b border-white/30 px-6 md:px-10 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5C4033]">
            📝 {meeting.title}
          </h1>
          <p className="text-sm text-[#8B7355]">
            {new Date(meeting.createdAt).toLocaleString()}
            {isConnected && <span className="ml-2 text-[#7BAE7F]">● Live</span>}
            {!isConnected && <span className="ml-2 text-[#b8a088]">● Offline</span>}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-[#fdf2f2] text-[#c0392b] rounded-xl hover:bg-[#fce8e8] transition-all text-sm font-medium"
          >
            🗑️ Clear
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#f5f0e8] text-[#8B7355] rounded-xl hover:bg-[#f0ebe3] transition-all text-sm font-medium"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="p-3 bg-[#fdf2f2] border border-[#f5c6c6] text-[#c0392b] rounded-xl text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-3 underline">Dismiss</button>
          </div>
        </div>
      )}
      {success && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="p-3 bg-[#e8f5e9] border border-[#81c784] text-[#2e7d32] rounded-xl text-sm">
            {success}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Recording Controls */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all ${
                isListening 
                  ? 'bg-[#E8C872] pulse-recording' 
                  : 'btn-primary text-lg'
              }`}
            >
              {isListening ? '🔴 Recording... Click to Stop' : '🎤 Start Recording'}
            </button>
            <div className="flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full ${isListening ? 'bg-[#E8C872] animate-pulse' : 'bg-[#d4c5b8]'}`}></span>
              <span className="text-sm text-[#8B7355]">
                {isListening ? 'Listening... speak clearly' : 'Click record to start'}
              </span>
            </div>
            {isSaving && (
              <span className="text-sm text-[#7BAE7F] bg-[#eaf5eb] px-3 py-1 rounded-full">
                💾 Saving...
              </span>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-[#8B7355]">
          <span className="bg-white/60 px-3 py-1 rounded-full">📝 {stats.chars} chars</span>
          <span className="bg-white/60 px-3 py-1 rounded-full">📖 {stats.words} words</span>
          <span className="bg-white/60 px-3 py-1 rounded-full">📄 {stats.lines} lines</span>
        </div>

        {/* Transcription */}
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#5C4033]">📄 Transcription</h2>
          </div>
          <div className="bg-[#faf8f5] rounded-xl p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
            {combinedTranscript ? (
              <p className="text-[#5C4033] whitespace-pre-wrap leading-relaxed">
                {combinedTranscript}
              </p>
            ) : (
              <p className="text-[#b8a088] text-center py-8">
                🎙️ Start recording to see transcription here...
              </p>
            )}
          </div>
        </div>

        {/* AI Summary */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-[#5C4033]">✨ AI Summary</h2>
            <button
              onClick={handleSummarize}
              disabled={isGenerating}
              className={`btn-brown ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Generating...
                </>
              ) : (
                '✨ Generate Summary'
              )}
            </button>
          </div>
          <div className="bg-[#fcf9f5] border border-[#f0ebe3] rounded-xl p-6 min-h-[150px]">
            {summary ? (
              <div className="whitespace-pre-wrap text-[#5C4033] leading-relaxed">
                {summary}
              </div>
            ) : (
              <p className="text-[#b8a088] text-center py-4">
                Click "Generate Summary" to analyze your meeting notes...
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <button onClick={handleSave} className="btn-primary">
            💾 Save Now
          </button>
          <button onClick={handleCopyAll} className="btn-brown">
            📋 Copy All
          </button>
          {summary && (
            <button onClick={handleDownload} className="btn-secondary">
              📥 Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}