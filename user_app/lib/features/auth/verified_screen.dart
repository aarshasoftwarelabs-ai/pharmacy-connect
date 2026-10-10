import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';

class VerifiedScreen extends StatelessWidget {
  const VerifiedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Bottom wave
          Positioned(
            left: 0, right: 0, bottom: 0,
            height: 180,
            child: CustomPaint(painter: _BottomWavePainter()),
          ),
          
          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 16),
                // Logo
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset('assets/images/logo.png', height: 48),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Dava Setu',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF1E1E2D),
                            letterSpacing: -0.5,
                          ),
                        ),
                        Text(
                          'Your Health • Our Priority',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                
                const Spacer(flex: 1),
                
                // Illustration
                Image.asset(
                  'assets/images/verified_illustration.png',
                  height: 200,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(height: 200),
                ),
                
                const SizedBox(height: 32),
                
                // Title
                RichText(
                  text: const TextSpan(
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1E1E2D),
                    ),
                    children: [
                      TextSpan(text: 'Email '),
                      TextSpan(
                        text: 'Verified!',
                        style: TextStyle(color: AppColors.primary),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Subtitle
                Text(
                  'Your email has been successfully verified.\nYou are all set to continue.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey.shade600,
                    height: 1.5,
                  ),
                ),
                
                const Spacer(flex: 1),
                
                // Continue Button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pushNamedAndRemoveUntil(
                          context,
                          AppRoutes.main,
                          (route) => false,
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Continue',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                        ],
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Shield Box
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F3FF),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.shield_outlined, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Your data is safe with us',
                                style: TextStyle(
                                  color: Color(0xFF1E1E2D),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'We keep your information secure\nand private.',
                                style: TextStyle(
                                  color: Colors.grey.shade600,
                                  fontSize: 13,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const Spacer(flex: 2),
                
                // Footer text over waves
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Safe',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 8),
                      child: Icon(Icons.circle, color: Colors.white, size: 4),
                    ),
                    const Text(
                      'Secure',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 8),
                      child: Icon(Icons.circle, color: Colors.white, size: 4),
                    ),
                    const Text(
                      'Always with you',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ],
                ),
                
                const SizedBox(height: 24),
              ],
            ),
          ),
          
          // The shield icon in the wave (absolute positioned)
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  margin: const EdgeInsets.only(bottom: 24),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 1),
                  ),
                  child: const Icon(Icons.security, color: Colors.white, size: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomWavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFE0E7FF), Color(0xFF8B5CF6)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, size.height - 150, size.width, 150))
      ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(0, size.height);
    path.lineTo(0, size.height - 80);
    
    // First wave (lighter color layered behind)
    final paint2 = Paint()
      ..color = const Color(0xFFE0E7FF).withValues(alpha: 0.6)
      ..style = PaintingStyle.fill;
      
    final path2 = Path();
    path2.moveTo(0, size.height);
    path2.lineTo(0, size.height - 100);
    path2.quadraticBezierTo(
      size.width * 0.25, 
      size.height - 130, 
      size.width * 0.5, 
      size.height - 90
    );
    path2.quadraticBezierTo(
      size.width * 0.75, 
      size.height - 50, 
      size.width, 
      size.height - 80
    );
    path2.lineTo(size.width, size.height);
    path2.close();
    canvas.drawPath(path2, paint2);

    // Main bottom wave
    path.quadraticBezierTo(
      size.width * 0.3, 
      size.height - 60, 
      size.width * 0.5, 
      size.height - 90
    );
    path.quadraticBezierTo(
      size.width * 0.75, 
      size.height - 130, 
      size.width, 
      size.height - 100
    );
    path.lineTo(size.width, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
