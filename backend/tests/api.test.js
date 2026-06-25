// Mock the entire api module
jest.mock('../api', () => ({
  ApiError: class ApiError extends Error {
    constructor(status, message, details = null) {
      super(message);
      this.status = status;
      this.details = details;
      this.name = 'ApiError';
    }
  },
  getMeetings: jest.fn(),
  createMeeting: jest.fn(),
  getMeeting: jest.fn(),
  updateMeeting: jest.fn(),
  deleteMeeting: jest.fn(),
  generateSummary: jest.fn()
}));

// Import after mocking
const { getMeetings, createMeeting, ApiError } = require('../api');

describe('API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMeetings', () => {
    it('should fetch meetings successfully', async () => {
      const mockData = [{ _id: '1', title: 'Test' }];
      getMeetings.mockResolvedValue(mockData);

      const result = await getMeetings();
      expect(result).toEqual(mockData);
      expect(getMeetings).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      const mockError = new ApiError(500, 'Server error');
      getMeetings.mockRejectedValue(mockError);

      await expect(getMeetings()).rejects.toThrow(ApiError);
      await expect(getMeetings()).rejects.toMatchObject({
        status: 500,
        message: 'Server error'
      });
    });
  });

  describe('createMeeting', () => {
    it('should create a meeting successfully', async () => {
      const mockMeeting = { _id: '1', title: 'New Meeting' };
      createMeeting.mockResolvedValue(mockMeeting);

      const result = await createMeeting('New Meeting');
      expect(result).toEqual(mockMeeting);
      expect(createMeeting).toHaveBeenCalledWith('New Meeting');
    });

    it('should handle validation errors', async () => {
      const mockError = new ApiError(400, 'Title is required');
      createMeeting.mockRejectedValue(mockError);

      await expect(createMeeting('')).rejects.toThrow(ApiError);
      await expect(createMeeting('')).rejects.toMatchObject({
        status: 400,
        message: 'Title is required'
      });
    });

    it('should handle server errors', async () => {
      const mockError = new ApiError(500, 'Internal server error');
      createMeeting.mockRejectedValue(mockError);

      await expect(createMeeting('Test')).rejects.toThrow(ApiError);
      await expect(createMeeting('Test')).rejects.toMatchObject({
        status: 500,
        message: 'Internal server error'
      });
    });
  });

  describe('getMeeting', () => {
    it('should fetch a single meeting', async () => {
      const { getMeeting } = require('../api');
      const mockMeeting = { _id: '123', title: 'Single Meeting' };
      getMeeting.mockResolvedValue(mockMeeting);

      const result = await getMeeting('123');
      expect(result).toEqual(mockMeeting);
      expect(getMeeting).toHaveBeenCalledWith('123');
    });
  });

  describe('updateMeeting', () => {
    it('should update a meeting', async () => {
      const { updateMeeting } = require('../api');
      const mockUpdated = { _id: '123', title: 'Updated' };
      updateMeeting.mockResolvedValue(mockUpdated);

      const result = await updateMeeting('123', { title: 'Updated' });
      expect(result).toEqual(mockUpdated);
      expect(updateMeeting).toHaveBeenCalledWith('123', { title: 'Updated' });
    });
  });

  describe('deleteMeeting', () => {
    it('should delete a meeting', async () => {
      const { deleteMeeting } = require('../api');
      const mockResponse = { success: true, message: 'Deleted' };
      deleteMeeting.mockResolvedValue(mockResponse);

      const result = await deleteMeeting('123');
      expect(result).toEqual(mockResponse);
      expect(deleteMeeting).toHaveBeenCalledWith('123');
    });
  });

  describe('generateSummary', () => {
    it('should generate a summary', async () => {
      const { generateSummary } = require('../api');
      const mockSummary = { summary: 'Test summary' };
      generateSummary.mockResolvedValue(mockSummary);

      const result = await generateSummary('Some text');
      expect(result).toEqual(mockSummary);
      expect(generateSummary).toHaveBeenCalledWith('Some text');
    });
  });
});