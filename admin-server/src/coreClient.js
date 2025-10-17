const axios = require('axios');
const { ADMIN_API_KEY, CORE_API_BASE_URL } = require('./config');

const coreClient = axios.create({
  baseURL: CORE_API_BASE_URL,
  timeout: 12000,
});

coreClient.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  nextConfig.headers = {
    ...(config.headers || {}),
    'Content-Type': 'application/json',
    'x-admin-token': ADMIN_API_KEY,
    'x-admin-api-key': ADMIN_API_KEY,
    Authorization: config.headers?.Authorization || `Bearer ${ADMIN_API_KEY}`,
  };
  return nextConfig;
});

function formatAxiosError(error) {
  if (error.response) {
    const { status, data } = error.response;
    const message =
      data?.message || data?.error || `Core API request failed with status ${status}.`;
    const err = new Error(message);
    err.status = status;
    err.payload = data;
    return err;
  }

  if (error.request) {
    const err = new Error('Core API did not respond.');
    err.status = 504;
    return err;
  }

  const err = new Error(error.message || 'Core API request failed.');
  err.status = 500;
  return err;
}

async function coreRequest(config) {
  try {
    const response = await coreClient.request(config);
    return response.data;
  } catch (error) {
    throw formatAxiosError(error);
  }
}

module.exports = { coreRequest };
