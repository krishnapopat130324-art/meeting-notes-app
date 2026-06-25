const request = require('supertest');
const express = require('express');
const routes = require('../routes');

// Mock the database
jest.mock('../database-sqlite', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
  Meeting: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Meeting API Tests', () => {
  let Meeting;

  beforeEach(() => {
    jest.clearAllMocks();
    Meeting = require('../database-sqlite').Meeting;
  });

  describe('POST /api/meetings', () => {
    it('should create a meeting successfully', async () => {
      const mockMeeting = {
        _id: '12345',
        title: 'Test Meeting',
        transcript: '',
        summary: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      Meeting.create.mockResolvedValue(mockMeeting);

      const response = await request(app)
        .post('/api/meetings')
        .send({ title: 'Test Meeting' });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Meeting');
    });

    it('should return error if title is empty', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });

    it('should return error if title is too long', async () => {
      const longTitle = 'a'.repeat(101);
      const response = await request(app)
        .post('/api/meetings')
        .send({ title: longTitle });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/meetings', () => {
    it('should return all meetings', async () => {
      const mockMeetings = [
        { _id: '1', title: 'Meeting 1' },
        { _id: '2', title: 'Meeting 2' }
      ];
      
      Meeting.find.mockResolvedValue(mockMeetings);

      const response = await request(app).get('/api/meetings');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('should return empty array when no meetings', async () => {
      Meeting.find.mockResolvedValue([]);

      const response = await request(app).get('/api/meetings');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('should return a meeting by ID', async () => {
      const mockMeeting = {
        _id: '12345',
        title: 'Test Meeting',
        transcript: 'Some text'
      };
      
      Meeting.findById.mockResolvedValue(mockMeeting);

      const response = await request(app).get('/api/meetings/12345');
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Meeting');
    });

    it('should return 404 if meeting not found', async () => {
      Meeting.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/meetings/99999');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('PUT /api/meetings/:id', () => {
    it('should update a meeting', async () => {
      const updatedMeeting = {
        _id: '12345',
        title: 'Updated Meeting',
        transcript: 'New transcript',
        summary: 'New summary'
      };
      
      Meeting.findById.mockResolvedValue(updatedMeeting);
      Meeting.findByIdAndUpdate.mockResolvedValue(updatedMeeting);

      const response = await request(app)
        .put('/api/meetings/12345')
        .send({ transcript: 'New transcript', summary: 'New summary' });
      
      expect(response.status).toBe(200);
      expect(response.body.transcript).toBe('New transcript');
    });
  });

  describe('DELETE /api/meetings/:id', () => {
    it('should delete a meeting', async () => {
      const mockMeeting = { _id: '12345', title: 'Test Meeting' };
      
      Meeting.findById.mockResolvedValue(mockMeeting);
      Meeting.findByIdAndDelete.mockResolvedValue(mockMeeting);

      const response = await request(app).delete('/api/meetings/12345');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});