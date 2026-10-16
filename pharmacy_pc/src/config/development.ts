export function getPharmacyId(): number {
  try {
    const localData = localStorage.getItem('pharmacy_profile_data');
    if (localData) {
      const profile = JSON.parse(localData);
      if (profile.id) return Number(profile.id);
      if (profile.pharmacyId) return Number(profile.pharmacyId);
      if (profile.pharmacy_id) return Number(profile.pharmacy_id);
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.pharmacyId) return Number(u.pharmacyId);
      if (u.pharmacy_id) return Number(u.pharmacy_id);
    }
  } catch (e) {}
  
  return 8; // Default to active store (K.Y Pharmacy, ID 8)
}
