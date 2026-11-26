import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// In-app Privacy Policy & Compliance screen reflecting the exact permissions,
/// data storage, and pharmacy regulations used by DavaSetu Pharmacy Mobile.
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Privacy Policy & Compliance'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.circular(20),
                boxShadow: AppColors.softShadow,
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.verified_user_rounded, color: Colors.white, size: 24),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'DavaSetu Pharmacy Privacy Policy',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    'App ID: com.davasetu.pharmacy_mobile • Effective: November 2026',
                    style: TextStyle(color: Color(0xFFD1FAE5), fontSize: 11.5, fontWeight: FontWeight.w600),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'DavaSetu Pharmacy Mobile is a B2B pharmacy point-of-sale (POS), stock inventory, and GST billing application built exclusively for licensed retail pharmacies and medical stores.',
                    style: TextStyle(color: Colors.white, fontSize: 12.5, height: 1.45),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _buildPolicySection(
              icon: Icons.badge_outlined,
              iconColor: AppColors.primary,
              title: '1. Information Collected & Stored',
              bullets: const [
                'Store & Account Details: Pharmacy name, owner/staff name, mobile number, email address, store address, Drug License number, and GSTIN entered during Sign Up, OTP login, or profile setup.',
                'Pharmacy Operations Data: Medicine catalog (name, generic salt, batch number, expiry date, MRP, selling price, stock count), supplier directory, customer names/phone numbers entered at billing, doctor/prescriber names, and GST invoice records.',
                'On-Device Local Cache: Authentication JWT token, cached pharmacy profile, medicine catalog cache, offline pending bills queue, and saved Bluetooth printer MAC/paper size stored locally via SharedPreferences for offline POS continuity.',
              ],
            ),
            const SizedBox(height: 12),
            _buildPolicySection(
              icon: Icons.security_rounded,
              iconColor: const Color(0xFF2563EB),
              title: '2. Device Permissions & Exact Purpose',
              bullets: const [
                'Internet (INTERNET): Syncs store inventory, POS invoices, OTP verification, Schedule H1 entries, suppliers, customers, and sales reports over encrypted HTTPS (TLS) with the DavaSetu cloud server.',
                'Camera (CAMERA): Used strictly to scan medicine barcodes/QR codes and recognize printed batch/expiry/MRP text on medicine boxes on-device. Images or camera frames are not stored or uploaded for advertising or tracking.',
                'Bluetooth (BLUETOOTH, BLUETOOTH_ADMIN on Android 11 & below; BLUETOOTH_SCAN with neverForLocation, BLUETOOTH_CONNECT on Android 12+): Used strictly to connect and print 58mm/80mm POS thermal receipts on paired Bluetooth thermal printers. DavaSetu does not declare or collect GPS/device location.',
              ],
            ),
            const SizedBox(height: 12),
            _buildPolicySection(
              icon: Icons.sync_lock_rounded,
              iconColor: const Color(0xFF059669),
              title: '3. Data Usage, Sharing & Security',
              bullets: const [
                'No Ads & No Data Selling: The app contains zero third-party advertising SDKs and never sells or rents pharmacy, customer, or patient data.',
                'Automated Invoice Messaging: When enabled by the pharmacy, invoice summaries are dispatched to the customer mobile number via the store\'s configured WhatsApp/SMS gateway.',
                'PC POS Live Sync: In Staff/Owner Scanner mode, scanned medicine items are transmitted strictly to your own store\'s connected DavaSetu PC Software terminal.',
                'Authentication Protection: Owner logins use OTP verification sent to the registered email/messaging channels (or staff 4-digit PIN for Counter Scanner mode) with encrypted JWT session tokens.',
              ],
            ),
            const SizedBox(height: 12),
            _buildPolicySection(
              icon: Icons.gavel_rounded,
              iconColor: const Color(0xFFDC2626),
              title: '4. Regulatory Compliance & User Responsibilities',
              bullets: const [
                'Schedule H1 Register (Drugs & Cosmetics Rules, 1945 — Rule 65 & Rule 97): Stores are responsible for accurately recording patient, prescriber, medicine, batch, and quantity details for Schedule H1 medicines.',
                'GST & Tax Records: Invoices, HSN codes, and CGST/SGST summaries generated in the app assist store accounting; the licensed pharmacy owner remains responsible for statutory CA/GST filings.',
                'Customer Consent: Pharmacies must collect customer phone numbers and dispatch digital receipts in compliance with applicable local privacy rules.',
                'Not Medical Advice: DavaSetu is strictly an operational billing and stock ERP utility and does not provide medical diagnosis, clinical advice, or treatment.',
              ],
            ),
            const SizedBox(height: 12),
            _buildPolicySection(
              icon: Icons.delete_outline_rounded,
              iconColor: const Color(0xFFD97706),
              title: '5. Data Retention, License Status & Account Deletion',
              bullets: const [
                'Local Sign Out: Signing out in Store Profile & Settings immediately clears locally stored session tokens and cached store data on this device.',
                'Account & Data Deletion: Store owners can request deletion of their cloud store account and personal contact details by contacting DavaSetu support or their pharmacy administrator. Statutory tax/Schedule H1 logs may be retained where required by Indian law.',
                'Subscription Status: Mobile license validity is synced from the backend; store plans are managed via DavaSetu PC Software or pharmacy administration.',
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Contact & Privacy Support',
                    style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'For privacy inquiries, data corrections, or account deletion requests, please contact your DavaSetu administrator or email: davasetu.otp@gmail.com',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.45),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPolicySection({
    required IconData icon,
    required Color iconColor,
    required String title,
    required List<String> bullets,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: AppColors.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...bullets.map(
            (text) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        color: iconColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      text,
                      style: const TextStyle(
                        fontSize: 12.2,
                        color: AppColors.textSecondary,
                        height: 1.45,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
