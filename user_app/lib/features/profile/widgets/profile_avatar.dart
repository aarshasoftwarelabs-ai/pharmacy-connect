import 'package:flutter/material.dart';

class ProfileAvatar extends StatelessWidget {
  final double size;
  final IconData? badgeIcon;
  final VoidCallback? onBadgeTap;

  const ProfileAvatar({
    super.key,
    this.size = 76,
    this.badgeIcon,
    this.onBadgeTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipOval(
              child: CustomPaint(
                size: Size(size, size),
                painter: _BoyAvatarPainter(),
              ),
            ),
          ),
          if (badgeIcon != null)
            Positioned(
              right: -2,
              bottom: -2,
              child: GestureDetector(
                onTap: onBadgeTap,
                child: Container(
                  padding: EdgeInsets.all(size * 0.08),
                  decoration: BoxDecoration(
                    color: const Color(0xFF6D28D9),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6D28D9).withOpacity(0.3),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    badgeIcon,
                    color: Colors.white,
                    size: size * 0.22,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _BoyAvatarPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Background circle
    final bgPaint = Paint()..color = const Color(0xFFE0E7FF);
    canvas.drawCircle(Offset(w / 2, h / 2), w / 2, bgPaint);

    // Shirt (Blue)
    final shirtPaint = Paint()..color = const Color(0xFF2563EB);
    final shirtPath = Path()
      ..moveTo(w * 0.15, h)
      ..quadraticBezierTo(w * 0.2, h * 0.72, w * 0.35, h * 0.7)
      ..lineTo(w * 0.65, h * 0.7)
      ..quadraticBezierTo(w * 0.8, h * 0.72, w * 0.85, h)
      ..close();
    canvas.drawPath(shirtPath, shirtPaint);

    // Collar / Inner Shirt
    final collarPaint = Paint()..color = const Color(0xFF1D4ED8);
    final collarPath = Path()
      ..moveTo(w * 0.38, h * 0.7)
      ..lineTo(w * 0.5, h * 0.82)
      ..lineTo(w * 0.62, h * 0.7)
      ..close();
    canvas.drawPath(collarPath, collarPaint);

    // Neck
    final skinPaint = Paint()..color = const Color(0xFFFED7AA);
    final neckPath = Path()
      ..moveTo(w * 0.42, h * 0.6)
      ..lineTo(w * 0.42, h * 0.72)
      ..lineTo(w * 0.58, h * 0.72)
      ..lineTo(w * 0.58, h * 0.6)
      ..close();
    canvas.drawPath(neckPath, skinPaint);

    // Ears
    canvas.drawCircle(Offset(w * 0.28, h * 0.5), w * 0.08, skinPaint);
    canvas.drawCircle(Offset(w * 0.72, h * 0.5), w * 0.08, skinPaint);

    // Face / Head
    final faceRect = Rect.fromCenter(
      center: Offset(w / 2, h * 0.5),
      width: w * 0.46,
      height: w * 0.52,
    );
    canvas.drawRRect(RRect.fromRectAndRadius(faceRect, Radius.circular(w * 0.23)), skinPaint);

    // Cheeks
    final cheekPaint = Paint()..color = const Color(0xFFFCA5A5).withOpacity(0.4);
    canvas.drawCircle(Offset(w * 0.36, h * 0.55), w * 0.05, cheekPaint);
    canvas.drawCircle(Offset(w * 0.64, h * 0.55), w * 0.05, cheekPaint);

    // Eyes
    final eyePaint = Paint()..color = const Color(0xFF1E293B);
    canvas.drawCircle(Offset(w * 0.4, h * 0.48), w * 0.035, eyePaint);
    canvas.drawCircle(Offset(w * 0.6, h * 0.48), w * 0.035, eyePaint);

    // Eyebrows
    final browPaint = Paint()
      ..color = const Color(0xFF1E293B)
      ..strokeWidth = w * 0.025
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.36, h * 0.42), Offset(w * 0.44, h * 0.43), browPaint);
    canvas.drawLine(Offset(w * 0.56, h * 0.43), Offset(w * 0.64, h * 0.42), browPaint);

    // Smile
    final smilePaint = Paint()
      ..color = const Color(0xFF9A3412)
      ..strokeWidth = w * 0.03
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final smilePath = Path()
      ..moveTo(w * 0.44, h * 0.57)
      ..quadraticBezierTo(w * 0.5, h * 0.63, w * 0.56, h * 0.57);
    canvas.drawPath(smilePath, smilePaint);

    // Hair
    final hairPaint = Paint()..color = const Color(0xFF1E293B);
    final hairPath = Path()
      ..moveTo(w * 0.26, h * 0.48)
      ..quadraticBezierTo(w * 0.22, h * 0.24, w * 0.5, h * 0.22)
      ..quadraticBezierTo(w * 0.78, h * 0.24, w * 0.74, h * 0.48)
      ..quadraticBezierTo(w * 0.68, h * 0.32, w * 0.5, h * 0.34)
      ..quadraticBezierTo(w * 0.36, h * 0.32, w * 0.26, h * 0.48)
      ..close();
    canvas.drawPath(hairPath, hairPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class LeafWatermarkPainter extends CustomPainter {
  final Color color;

  const LeafWatermarkPainter({this.color = const Color(0x1AFFFFFF)});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    // Leaf 1
    final leaf1 = Path()
      ..moveTo(size.width * 0.85, 0)
      ..quadraticBezierTo(size.width * 1.05, size.height * 0.4, size.width * 0.7, size.height * 0.8)
      ..quadraticBezierTo(size.width * 0.5, size.height * 0.4, size.width * 0.85, 0);
    canvas.drawPath(leaf1, paint);

    // Leaf 2
    final leaf2 = Path()
      ..moveTo(size.width, size.height * 0.2)
      ..quadraticBezierTo(size.width * 1.1, size.height * 0.7, size.width * 0.8, size.height)
      ..quadraticBezierTo(size.width * 0.65, size.height * 0.6, size.width, size.height * 0.2);
    canvas.drawPath(leaf2, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
