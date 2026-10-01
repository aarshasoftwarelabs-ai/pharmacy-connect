/**
 * Development Configuration
 * 
 * Fetches the currently authenticated pharmacy ID from localStorage.
 * Falls back to 1 if not authenticated.
 */
function getActualPharmacyId(): number {
  try {
    const localData = localStorage.getItem('pharmacy_profile_data');
    if (localData) {
      const profile = JSON.parse(localData);
      if (profile.id) return profile.id;
    }
  } catch (e) {}
  return 1;
}

export const DEV_PHARMACY_ID = getActualPharmacyId();
