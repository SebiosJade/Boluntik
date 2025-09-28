// Test setup and configuration
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

// Mock file system for testing
const mockData = {
  users: [],
  events: [],
  eventParticipants: [],
  emailVerifications: []
};

// Mock fs-extra for testing
jest.mock('fs-extra', () => ({
  readFile: jest.fn((filePath) => {
    const filename = path.basename(filePath);
    const data = mockData[filename.replace('.json', '')] || [];
    return Promise.resolve(JSON.stringify(data));
  }),
  writeFile: jest.fn(() => Promise.resolve()),
  mkdir: jest.fn(() => Promise.resolve()),
  pathExists: jest.fn(() => Promise.resolve(true))
}));

// Mock nodemailer for testing
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' }))
  }))
}));

// Test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: '$2a$10$test.hash',
    role: 'volunteer',
    createdAt: new Date().toISOString(),
    hasCompletedOnboarding: false,
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString(),
    avatar: '/uploads/avatars/default-avatar.png',
    phone: '',
    location: '',
    bio: '',
    skills: [],
    availability: [],
    interests: [],
    ...overrides
  }),

  createMockEvent: (overrides = {}) => ({
    id: 'test-event-id',
    title: 'Test Event',
    description: 'Test Description',
    date: '12/31/2024',
    time: '10:00 AM',
    endTime: '2:00 PM',
    location: 'Test Location',
    maxParticipants: '10',
    actualParticipants: '0',
    eventType: 'volunteer',
    difficulty: 'beginner',
    cause: 'Test Cause',
    skills: 'Test Skills',
    ageRestriction: '18+',
    equipment: 'None',
    org: 'Test Org',
    organizationId: 'test-org-id',
    organizationName: 'Test Organization',
    createdBy: 'test-org-id',
    createdByName: 'Test Org',
    createdByEmail: 'org@example.com',
    createdByRole: 'organization',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  createMockEventParticipant: (overrides = {}) => ({
    id: 'test-participant-id',
    eventId: 'test-event-id',
    eventTitle: 'Test Event',
    userId: 'test-user-id',
    userName: 'Test User',
    userEmail: 'test@example.com',
    joinedAt: new Date().toISOString(),
    ...overrides
  }),

  createMockJWT: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { sub: 'test-user-id', ...payload },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },

  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
  }),

  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  mockNext: () => jest.fn()
};

// Setup and teardown
beforeAll(() => {
  console.log('🧪 Setting up test environment...');
});

afterAll(() => {
  console.log('🧹 Cleaning up test environment...');
});

beforeEach(() => {
  // Reset mock data before each test
  Object.keys(mockData).forEach(key => {
    mockData[key] = [];
  });
  
  // Clear all mocks
  jest.clearAllMocks();
});

module.exports = {
  mockData,
  testUtils: global.testUtils
};
