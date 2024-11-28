// Browser-compatible logging service
export function logApiCall(endpoint: string, params: any, response: any) {
  console.group('API Call');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Endpoint:', endpoint);
  console.log('Params:', params);
  console.log('Response:', response);
  console.groupEnd();
}

export function logError(error: any) {
  console.group('Error');
  console.log('Timestamp:', new Date().toISOString());
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  if (error.response?.data) {
    console.error('Response Data:', error.response.data);
  }
  console.groupEnd();
}