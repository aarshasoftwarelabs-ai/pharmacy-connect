import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RefillRemindersScreen extends StatelessWidget {
  const RefillRemindersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Refill Reminders', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 20)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.history_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text('No Refills Due', style: GoogleFonts.outfit(fontSize: 18, color: Colors.grey[700])),
          ],
        ),
      ),
    );
  }
}
