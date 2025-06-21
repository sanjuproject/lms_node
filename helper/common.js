const crypto = require('crypto');

function generatePassword(length) {
  return crypto
    .randomBytes(length)
    .toString('base64') // Convert to base64 string
    .slice(0, length)   // Trim to desired length
    .replace(/[+/=]/g, ''); // Remove special characters
}


module.exports = {
  generatePassword
}