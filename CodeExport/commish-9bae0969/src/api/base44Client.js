import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "688752ed3967589f9bae0969", 
  requiresAuth: true // Ensure authentication is required for all operations
});
