// Authentication tests
const request = require('supertest');
const app = require('../index');
const { testUtils } = require('./setup');

describe('Authentication API', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'volunteer',
        verificationCode: '123456'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should reject signup with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123',
        verificationCode: '123456'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject signup with weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
        verificationCode: '123456'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject signup with missing verification code', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(() => {
      // Add a test user to mock data
      const mockUser = testUtils.createMockUser({
        email: 'test@example.com',
        passwordHash: '$2a$10$test.hash' // Mock bcrypt hash
      });
      testUtils.mockData.users.push(mockUser);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(() => {
      const mockUser = testUtils.createMockUser();
      testUtils.mockData.users.push(mockUser);
      authToken = testUtils.createMockJWT({ sub: mockUser.id });
    });

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe('test-user-id');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/send-verification', () => {
    it('should send verification code for new email', async () => {
      const emailData = {
        email: 'newuser@example.com'
      };

      const response = await request(app)
        .post('/api/auth/send-verification')
        .send(emailData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject verification for existing email', async () => {
      // Add existing user
      const existingUser = testUtils.createMockUser({ email: 'existing@example.com' });
      testUtils.mockData.users.push(existingUser);

      const emailData = {
        email: 'existing@example.com'
      };

      const response = await request(app)
        .post('/api/auth/send-verification')
        .send(emailData)
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject verification with invalid email', async () => {
      const emailData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/send-verification')
        .send(emailData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
