const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const usersFile = path.join(dataDir, 'users.json');
const emailVerificationsFile = path.join(dataDir, 'emailVerifications.json');

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(usersFile);
  } catch {
    await fs.writeFile(usersFile, '[]', 'utf8');
  }
  try {
    await fs.access(emailVerificationsFile);
  } catch {
    await fs.writeFile(emailVerificationsFile, '[]', 'utf8');
  }
}

async function readUsers() {
  await ensureDataFiles();
  try {
    const data = await fs.readFile(usersFile, 'utf8');
    if (!data || data.trim() === '') {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.warn('Error reading users file, recreating with empty array:', error.message);
    await fs.writeFile(usersFile, '[]', 'utf8');
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

async function readEmailVerifications() {
  await ensureDataFiles();
  try {
    const data = await fs.readFile(emailVerificationsFile, 'utf8');
    if (!data || data.trim() === '') {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.warn('Error reading email verifications file, recreating with empty array:', error.message);
    await fs.writeFile(emailVerificationsFile, '[]', 'utf8');
    return [];
  }
}

async function writeEmailVerifications(verifications) {
  await fs.writeFile(emailVerificationsFile, JSON.stringify(verifications, null, 2), 'utf8');
}

module.exports = {
  readUsers,
  writeUsers,
  readEmailVerifications,
  writeEmailVerifications
};
