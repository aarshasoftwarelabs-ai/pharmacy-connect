export interface SponsoredBanner {
  id: number;
  title: string;
  companyName: string;
  badgeText: string;
  description?: string;
  schemeOffer?: string;
  bannerImageUrl?: string;
  bgGradientStart?: string;
  bgGradientEnd?: string;
  actionType: 'WHATSAPP' | 'CALL' | 'URL' | 'INFO';
  actionValue?: string;
  contactPerson?: string;
  priority: number;
  isActive: boolean;
  clickCount: number;
  impressionCount: number;
  createdAt?: string;
  updatedAt?: string;
}
