import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MyPrescriptionsScreen extends StatelessWidget {
  const MyPrescriptionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('My Prescriptions', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 20)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text('No Prescriptions Uploaded', style: GoogleFonts.outfit(fontSize: 18, color: Colors.grey[700])),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                // Navigate to upload
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F766E),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('Upload Prescription', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
