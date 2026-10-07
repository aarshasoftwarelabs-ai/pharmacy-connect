export function getPharmacyId(): number {
  try {
    const localData = localStorage.getItem('pharmacy_profile_data');
    if (localData) {
      const profile = JSON.parse(localData);
      if (profile.id) return profile.id;
    }
  } catch (e) {}
  
  // If we reach here, there is no valid pharmacy context.
  // We should redirect to login.
  if (window.location.pathname !== '/login') {
      window.location.href = '/login';
  }
  return 0; // Will cause API requests to fail cleanly if caught
}
