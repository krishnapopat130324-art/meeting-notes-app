const express = require('express');
const { Meeting } = require('./database-sqlite');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Initialize Gemini AI (if available)
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.log('⚠️ Gemini AI not configured. Summary feature will use fallback.');
}

// Validation Middleware
const validateMeetingTitle = (req, res, next) => {
  const { title } = req.body;
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Validation Error',
      message: 'Meeting title is required',
      details: { field: 'title', issue: 'Title cannot be empty' }
    });
  }
  if (title.trim().length > 100) {
    return res.status(400).json({ 
      error: 'Validation Error',
      message: 'Meeting title is too long',
      details: { field: 'title', issue: 'Maximum 100 characters', maxLength: 100 }
    });
  }
  req.body.title = title.trim();
  next();
};

const validateMeetingId = async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ 
      error: 'Validation Error',
      message: 'Meeting ID is required' 
    });
  }
  const meeting = await Meeting.findById(id);
  if (!meeting) {
    return res.status(404).json({ 
      error: 'Not Found',
      message: `Meeting with ID ${id} not found` 
    });
  }
  req.meeting = meeting;
  next();
};

// 1. Create a new meeting
router.post('/meetings', validateMeetingTitle, async (req, res) => {
  try {
    const { title } = req.body;
    const meeting = await Meeting.create({ title });
    console.log('✅ Meeting created:', meeting._id);
    res.status(201).json(meeting);
  } catch (error) {
    console.error('❌ Error creating meeting:', error);
    res.status(500).json({ 
      error: 'Database Error',
      message: 'Failed to create meeting. Please try again.' 
    });
  }
});

// 2. Get all meetings
router.get('/meetings', async (req, res) => {
  try {
    const meetings = await Meeting.find();
    console.log(`📋 Found ${meetings.length} meetings`);
    res.json(meetings);
  } catch (error) {
    console.error('❌ Error fetching meetings:', error);
    res.status(500).json({ 
      error: 'Database Error',
      message: 'Failed to fetch meetings. Please try again.' 
    });
  }
});

// 3. Get a single meeting by ID
router.get('/meetings/:id', validateMeetingId, async (req, res) => {
  try {
    res.json(req.meeting);
  } catch (error) {
    console.error('❌ Error fetching meeting:', error);
    res.status(500).json({ 
      error: 'Database Error',
      message: 'Failed to fetch meeting. Please try again.' 
    });
  }
});

// 4. Update meeting
router.put('/meetings/:id', validateMeetingId, async (req, res) => {
  try {
    const { transcript, summary } = req.body;
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { transcript: transcript || '', summary: summary || '' },
      { new: true }
    );
    console.log('✅ Meeting updated:', meeting._id);
    res.json(meeting);
  } catch (error) {
    console.error('❌ Error updating meeting:', error);
    res.status(500).json({ 
      error: 'Database Error',
      message: 'Failed to update meeting. Please try again.' 
    });
  }
});

// 5. Delete a meeting
router.delete('/meetings/:id', validateMeetingId, async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    console.log('✅ Meeting deleted:', req.params.id);
    res.json({ 
      success: true, 
      message: 'Meeting deleted successfully',
      id: req.params.id 
    });
  } catch (error) {
    console.error('❌ Error deleting meeting:', error);
    res.status(500).json({ 
      error: 'Database Error',
      message: 'Failed to delete meeting. Please try again.' 
    });
  }
});

// 6. Generate AI Summary (Improved)
router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    
    // Validation
    if (!text) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Text is required for summarization' 
      });
    }
    if (text.length < 10) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Text is too short to summarize. Minimum 10 characters required.',
        details: { currentLength: text.length, minLength: 10 }
      });
    }
    if (text.length > 5000) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Text is too long to summarize. Maximum 5000 characters.',
        details: { currentLength: text.length, maxLength: 5000 }
      });
    }

    // If Gemini is not configured, use fallback
    if (!genAI) {
      const fallbackSummary = generateFallbackSummary(text);
      return res.json({ summary: fallbackSummary });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
      You are a professional meeting assistant. Summarize the following meeting transcription.
      
      Format your response exactly like this:
      
      📝 Summary:
      (Write 2-3 sentences summarizing the main points)
      
      ✅ Action Items:
      - Action 1 (Person responsible)
      - Action 2 (Person responsible)
      
      🎯 Decisions Made:
      - Decision 1
      - Decision 2
      
      Transcription: ${text}
    `;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    
    if (!summary) {
      return res.json({ summary: generateFallbackSummary(text) });
    }
    
    res.json({ summary });
  } catch (error) {
    console.error('❌ Gemini error:', error);
    const fallbackSummary = generateFallbackSummary(req.body.text);
    res.json({ summary: fallbackSummary });
  }
});

// Fallback summary generator (when AI is unavailable)
function generateFallbackSummary(text) {
  const words = text.split(' ');
  const wordCount = words.length;
  
  let summary = `📝 Summary:\nThe meeting discussed ${wordCount} words of content. Key topics were covered and decisions were made.\n\n`;
  summary += `✅ Action Items:\n- Review the discussion points from the meeting\n- Follow up on any pending action items\n- Share meeting notes with the team\n\n`;
  summary += `🎯 Decisions Made:\n- Proceed with the planned actions\n- Schedule follow-up meeting if needed`;
  
  return summary;
}

module.exports = router;