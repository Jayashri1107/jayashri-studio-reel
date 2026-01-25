// Test file to verify that constants are using the correct live URLs
import { BASE_URL, API_BASE_URL } from '../Config/constants';

console.log('=== Live URL Verification ===');
console.log('Client Base URL:', BASE_URL);
console.log('Client API Base URL:', API_BASE_URL);

// Verify that the URLs are using the live domains
if (BASE_URL.includes('ipshopy.com')) {
  console.log('✓ Client Base URL is correctly set to live domain');
} else {
  console.log('✗ Client Base URL is not set to live domain');
}

export {
  BASE_URL,
  API_BASE_URL
};