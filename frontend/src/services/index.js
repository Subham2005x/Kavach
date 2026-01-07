// Barrel export for all services
// Barrel export for all services
export * from './auth.service';
export * from './api.service';

// Export for Dashboard
export { 
  getCurrentUser,
  logoutUser as logout,  // rename logoutUser -> logout
  onAuthChange 
} from './auth.service';

