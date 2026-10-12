import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Modern 3D Shiny Pill Capsule Widget
class ModernPillCapsule extends StatelessWidget {
  final double size;
  final Color primaryColor;
  final Color secondaryColor;
  final double angle; // in radians, e.g. -math.pi / 4

  const ModernPillCapsule({
    super.key,
    this.size = 32,
    this.primaryColor = const Color(0xFF0284C7),
    this.secondaryColor = const Color(0xFF38BDF8),
    this.angle = -math.pi / 4,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Transform.rotate(
        angle: angle,
        child: CustomPaint(
          size: Size(size, size * 0.5),
          painter: _CapsulePainter(
            primaryColor: primaryColor,
            secondaryColor: secondaryColor,
          ),
        ),
      ),
    );
  }
}

class _CapsulePainter extends CustomPainter {
  final Color primaryColor;
  final Color secondaryColor;

  _CapsulePainter({required this.primaryColor, required this.secondaryColor});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final r = h / 2;

    final rect = Rect.fromLTWH(0, 0, w, h);
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(r));

    // Shadow
    final shadowPaint = Paint()
      ..color = Colors.black.withOpacity(0.12)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
    canvas.drawRRect(rrect.shift(const Offset(1, 2)), shadowPaint);

    // Left half (Primary Color)
    canvas.save();
    canvas.clipRRect(rrect);
    final leftRect = Rect.fromLTWH(0, 0, w / 2, h);
    final leftPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          primaryColor.withOpacity(0.9),
          primaryColor,
          Color.lerp(primaryColor, Colors.black, 0.2)!,
        ],
      ).createShader(leftRect);
    canvas.drawRect(leftRect, leftPaint);

    // Right half (Secondary Color)
    final rightRect = Rect.fromLTWH(w / 2, 0, w / 2, h);
    final rightPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          secondaryColor.withOpacity(0.95),
          secondaryColor,
          Color.lerp(secondaryColor, Colors.black, 0.15)!,
        ],
      ).createShader(rightRect);
    canvas.drawRect(rightRect, rightPaint);

    // Center seam line
    final seamPaint = Paint()
      ..color = Colors.black.withOpacity(0.15)
      ..strokeWidth = 1;
    canvas.drawLine(Offset(w / 2, 0), Offset(w / 2, h), seamPaint);

    // Top Glossy Highlight (3D Glassy effect)
    final glossRect = Rect.fromLTWH(w * 0.15, h * 0.12, w * 0.7, h * 0.28);
    final glossRRect = RRect.fromRectAndRadius(glossRect, Radius.circular(h * 0.14));
    final glossPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.white.withOpacity(0.65),
          Colors.white.withOpacity(0.1),
        ],
      ).createShader(glossRect);
    canvas.drawRRect(glossRRect, glossPaint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Senior Gentleman ("Rameshbhai") Illustrated Avatar
class SeniorAvatarWidget extends StatelessWidget {
  final double size;

  const SeniorAvatarWidget({super.key, this.size = 54});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFFF1F5F9),
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C3AED).withOpacity(0.15),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipOval(
        child: CustomPaint(
          size: Size(size, size),
          painter: _SeniorAvatarPainter(),
        ),
      ),
    );
  }
}

class _SeniorAvatarPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Background
    final bgPaint = Paint()..color = const Color(0xFFEDE9FE);
    canvas.drawCircle(Offset(w / 2, h / 2), w / 2, bgPaint);

    // Shirt (Blue polo)
    final shirtPaint = Paint()..color = const Color(0xFF2563EB);
    final shirtPath = Path()
      ..moveTo(w * 0.1, h)
      ..quadraticBezierTo(w * 0.2, h * 0.75, w * 0.35, h * 0.72)
      ..lineTo(w * 0.65, h * 0.72)
      ..quadraticBezierTo(w * 0.8, h * 0.75, w * 0.9, h)
      ..close();
    canvas.drawPath(shirtPath, shirtPaint);

    // Collar
    final collarPaint = Paint()..color = const Color(0xFF1D4ED8);
    final collarPath = Path()
      ..moveTo(w * 0.36, h * 0.72)
      ..lineTo(w * 0.5, h * 0.82)
      ..lineTo(w * 0.64, h * 0.72)
      ..close();
    canvas.drawPath(collarPath, collarPaint);

    // Neck
    final skinPaint = Paint()..color = const Color(0xFFFCD34D);
    final neckPath = Path()
      ..moveTo(w * 0.42, h * 0.62)
      ..lineTo(w * 0.42, h * 0.74)
      ..lineTo(w * 0.58, h * 0.74)
      ..lineTo(w * 0.58, h * 0.62)
      ..close();
    canvas.drawPath(neckPath, skinPaint);

    // Ears
    canvas.drawCircle(Offset(w * 0.28, h * 0.5), w * 0.08, skinPaint);
    canvas.drawCircle(Offset(w * 0.72, h * 0.5), w * 0.08, skinPaint);

    // Face
    final faceRect = Rect.fromCenter(center: Offset(w / 2, h * 0.5), width: w * 0.46, height: w * 0.5);
    canvas.drawRRect(RRect.fromRectAndRadius(faceRect, Radius.circular(w * 0.23)), skinPaint);

    // Hair (Silver / Grey with volume)
    final hairPaint = Paint()..color = const Color(0xFFCBD5E1);
    final hairPath = Path()
      ..moveTo(w * 0.25, h * 0.48)
      ..quadraticBezierTo(w * 0.2, h * 0.25, w * 0.5, h * 0.22)
      ..quadraticBezierTo(w * 0.8, h * 0.25, w * 0.75, h * 0.48)
      ..quadraticBezierTo(w * 0.68, h * 0.32, w * 0.5, h * 0.33)
      ..quadraticBezierTo(w * 0.35, h * 0.32, w * 0.25, h * 0.48)
      ..close();
    canvas.drawPath(hairPath, hairPaint);

    // Eyeglasses (Round rims)
    final glassPaint = Paint()
      ..color = const Color(0xFF475569)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.035;
    canvas.drawCircle(Offset(w * 0.4, h * 0.49), w * 0.08, glassPaint);
    canvas.drawCircle(Offset(w * 0.6, h * 0.49), w * 0.08, glassPaint);
    canvas.drawLine(Offset(w * 0.48, h * 0.49), Offset(w * 0.52, h * 0.49), glassPaint);

    // Eyes inside glasses
    final eyePaint = Paint()..color = const Color(0xFF1E293B);
    canvas.drawCircle(Offset(w * 0.4, h * 0.49), w * 0.025, eyePaint);
    canvas.drawCircle(Offset(w * 0.6, h * 0.49), w * 0.025, eyePaint);

    // Smile
    final smilePaint = Paint()
      ..color = const Color(0xFF92400E)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = w * 0.03;
    final smilePath = Path()
      ..moveTo(w * 0.44, h * 0.59)
      ..quadraticBezierTo(w * 0.5, h * 0.64, w * 0.56, h * 0.59);
    canvas.drawPath(smilePath, smilePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Modern Medicine Bottle with Pills Illustration for Banner
class ModernMedicineBottleIllustration extends StatelessWidget {
  final double size;

  const ModernMedicineBottleIllustration({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        size: Size(size, size),
        painter: _BottleIllustrationPainter(),
      ),
    );
  }
}

class _BottleIllustrationPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Green Background Leaf
    final leafPaint = Paint()..color = const Color(0xFF6EE7B7).withOpacity(0.7);
    final leafPath = Path()
      ..moveTo(w * 0.8, h * 0.3)
      ..quadraticBezierTo(w * 1.0, h * 0.5, w * 0.85, h * 0.8)
      ..quadraticBezierTo(w * 0.65, h * 0.5, w * 0.8, h * 0.3);
    canvas.drawPath(leafPath, leafPaint);

    // Bottle Body (Cyan/Teal Gradient)
    final bottleRect = Rect.fromLTWH(w * 0.28, h * 0.26, w * 0.44, h * 0.56);
    final bottleRRect = RRect.fromRectAndRadius(bottleRect, Radius.circular(w * 0.1));
    final bottlePaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF38BDF8), Color(0xFF0284C7)],
      ).createShader(bottleRect);
    canvas.drawRRect(bottleRRect, bottlePaint);

    // Bottle Cap
    final capRect = Rect.fromLTWH(w * 0.35, h * 0.16, w * 0.3, h * 0.12);
    final capRRect = RRect.fromRectAndRadius(capRect, Radius.circular(w * 0.04));
    final capPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF6D28D9), Color(0xFF7C3AED)],
      ).createShader(capRect);
    canvas.drawRRect(capRRect, capPaint);

    // Bottle Label (White cross)
    final crossPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = w * 0.06
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.5, h * 0.46), Offset(w * 0.5, h * 0.62), crossPaint);
    canvas.drawLine(Offset(w * 0.42, h * 0.54), Offset(w * 0.58, h * 0.54), crossPaint);

    // Little Pill 1 (Bottom Right Pink/White)
    final pill1Paint = Paint()..color = const Color(0xFFF43F5E);
    canvas.drawCircle(Offset(w * 0.78, h * 0.78), w * 0.09, pill1Paint);

    // Little Pill 2 (Bottom Left Yellow)
    final pill2Paint = Paint()..color = const Color(0xFFFBBF24);
    canvas.drawCircle(Offset(w * 0.22, h * 0.8), w * 0.08, pill2Paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Modern 3D Pharmacy Storefront Icon
class ModernPharmacyStoreIcon extends StatelessWidget {
  final double size;
  const ModernPharmacyStoreIcon({super.key, this.size = 32});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        size: Size(size, size),
        painter: _PharmacyStorePainter(),
      ),
    );
  }
}

class _PharmacyStorePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Building body with rounded base
    final bodyRect = Rect.fromLTWH(w * 0.16, h * 0.32, w * 0.68, h * 0.58);
    final bodyRRect = RRect.fromRectAndRadius(bodyRect, Radius.circular(w * 0.1));
    final bodyPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF2DD4BF), Color(0xFF0F766E)],
      ).createShader(bodyRect);
    canvas.drawRRect(bodyRRect, bodyPaint);

    // Awning / Canopy Roof
    final awningPath = Path()
      ..moveTo(w * 0.1, h * 0.34)
      ..lineTo(w * 0.9, h * 0.34)
      ..lineTo(w * 0.84, h * 0.22)
      ..quadraticBezierTo(w * 0.5, h * 0.14, w * 0.16, h * 0.22)
      ..close();
    final awningPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF14B8A6), Color(0xFF0D9488)],
      ).createShader(Rect.fromLTWH(w * 0.1, h * 0.14, w * 0.8, h * 0.2));
    canvas.drawPath(awningPath, awningPaint);

    // Awning subtle stripes
    final stripePaint = Paint()
      ..color = Colors.white.withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.04;
    canvas.drawLine(Offset(w * 0.35, h * 0.22), Offset(w * 0.32, h * 0.34), stripePaint);
    canvas.drawLine(Offset(w * 0.65, h * 0.22), Offset(w * 0.68, h * 0.34), stripePaint);

    // Glass Door
    final doorRect = Rect.fromLTWH(w * 0.36, h * 0.54, w * 0.28, h * 0.36);
    final doorRRect = RRect.fromRectAndRadius(doorRect, Radius.circular(w * 0.05));
    final doorPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFFCCFBF1), Color(0xFF99F6E4)],
      ).createShader(doorRect);
    canvas.drawRRect(doorRRect, doorPaint);

    // Glass shine
    final shinePaint = Paint()
      ..color = Colors.white.withOpacity(0.7)
      ..strokeWidth = w * 0.03
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.42, h * 0.6), Offset(w * 0.46, h * 0.76), shinePaint);

    // Glowing Medical Cross Badge
    final crossPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = w * 0.065
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.5, h * 0.38), Offset(w * 0.5, h * 0.48), crossPaint);
    canvas.drawLine(Offset(w * 0.45, h * 0.43), Offset(w * 0.55, h * 0.43), crossPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Modern 3D Refill & Medicine Sync Icon
class ModernRefillSyncIcon extends StatelessWidget {
  final double size;
  const ModernRefillSyncIcon({super.key, this.size = 32});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        size: Size(size, size),
        painter: _RefillSyncPainter(),
      ),
    );
  }
}

class _RefillSyncPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final center = Offset(w / 2, h / 2);

    // Circular Orbiting Arrows
    final orbitRect = Rect.fromCircle(center: center, radius: w * 0.38);
    final arrowPaint = Paint()
      ..shader = const SweepGradient(
        colors: [Color(0xFFA78BFA), Color(0xFF6D28D9), Color(0xFFA78BFA)],
      ).createShader(orbitRect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.09
      ..strokeCap = StrokeCap.round;

    // Arcs
    canvas.drawArc(orbitRect, 0.4, 2.1, false, arrowPaint);
    canvas.drawArc(orbitRect, 3.5, 2.1, false, arrowPaint);

    // Arrowhead 1
    final headPaint = Paint()
      ..color = const Color(0xFF6D28D9)
      ..style = PaintingStyle.fill;
    final head1 = Path()
      ..moveTo(w * 0.88, h * 0.58)
      ..lineTo(w * 0.76, h * 0.74)
      ..lineTo(w * 0.95, h * 0.72)
      ..close();
    canvas.drawPath(head1, headPaint);

    // Arrowhead 2
    final head2 = Path()
      ..moveTo(w * 0.12, h * 0.42)
      ..lineTo(w * 0.24, h * 0.26)
      ..lineTo(w * 0.05, h * 0.28)
      ..close();
    canvas.drawPath(head2, headPaint);

    // Center 3D Capsule
    final pillRect = Rect.fromCenter(center: center, width: w * 0.4, height: h * 0.22);
    final pillRRect = RRect.fromRectAndRadius(pillRect, Radius.circular(h * 0.11));
    final pillPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
      ).createShader(pillRect);
    canvas.drawRRect(pillRRect, pillPaint);

    // Pill glossy highlight
    final glossPaint = Paint()
      ..color = Colors.white.withOpacity(0.65)
      ..strokeWidth = w * 0.035
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.36, h * 0.46), Offset(w * 0.64, h * 0.46), glossPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Modern 3D Prescription Pad / Rx Document Icon
class ModernPrescriptionDocIcon extends StatelessWidget {
  final double size;
  const ModernPrescriptionDocIcon({super.key, this.size = 32});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        size: Size(size, size),
        painter: _PrescriptionDocPainter(),
      ),
    );
  }
}

class _PrescriptionDocPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Clipboard background
    final boardRect = Rect.fromLTWH(w * 0.16, h * 0.14, w * 0.68, h * 0.76);
    final boardRRect = RRect.fromRectAndRadius(boardRect, Radius.circular(w * 0.1));
    final boardPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFEDE9FE), Color(0xFFDDD6FE)],
      ).createShader(boardRect);
    canvas.drawRRect(boardRRect, boardPaint);

    // Paper sheet
    final paperRect = Rect.fromLTWH(w * 0.22, h * 0.2, w * 0.56, h * 0.66);
    final paperRRect = RRect.fromRectAndRadius(paperRect, Radius.circular(w * 0.07));
    final paperPaint = Paint()..color = Colors.white;
    canvas.drawRRect(paperRRect, paperPaint);

    // Purple header
    final headerRect = Rect.fromLTWH(w * 0.22, h * 0.2, w * 0.56, h * 0.18);
    final headerRRect = RRect.fromRectAndCorners(
      headerRect,
      topLeft: Radius.circular(w * 0.07),
      topRight: Radius.circular(w * 0.07),
    );
    final headerPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
      ).createShader(headerRect);
    canvas.drawRRect(headerRRect, headerPaint);

    // Cross on header
    final crossPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = w * 0.04
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.5, h * 0.24), Offset(w * 0.5, h * 0.34), crossPaint);
    canvas.drawLine(Offset(w * 0.45, h * 0.29), Offset(w * 0.55, h * 0.29), crossPaint);

    // Text lines
    final linePaint = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = w * 0.035
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.32, h * 0.46), Offset(w * 0.68, h * 0.46), linePaint);
    canvas.drawLine(Offset(w * 0.32, h * 0.56), Offset(w * 0.68, h * 0.56), linePaint);
    canvas.drawLine(Offset(w * 0.32, h * 0.66), Offset(w * 0.52, h * 0.66), linePaint);

    // Green verification mark
    final checkPaint = Paint()
      ..color = const Color(0xFF10B981)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.045
      ..strokeCap = StrokeCap.round;
    final checkPath = Path()
      ..moveTo(w * 0.6, h * 0.68)
      ..lineTo(w * 0.65, h * 0.73)
      ..lineTo(w * 0.73, h * 0.63);
    canvas.drawPath(checkPath, checkPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Modern 3D Express Delivery Truck Icon
class ModernDeliveryTruckIcon extends StatelessWidget {
  final double size;
  const ModernDeliveryTruckIcon({super.key, this.size = 32});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        size: Size(size, size),
        painter: _DeliveryTruckPainter(),
      ),
    );
  }
}

class _DeliveryTruckPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Truck Cargo Box
    final boxRect = Rect.fromLTWH(w * 0.12, h * 0.26, w * 0.48, h * 0.44);
    final boxRRect = RRect.fromRectAndRadius(boxRect, Radius.circular(w * 0.08));
    final boxPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF14B8A6), Color(0xFF0D9488)],
      ).createShader(boxRect);
    canvas.drawRRect(boxRRect, boxPaint);

    // Cross badge on cargo box
    final crossPaint = Paint()
      ..color = Colors.white.withOpacity(0.9)
      ..strokeWidth = w * 0.045
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.36, h * 0.41), Offset(w * 0.36, h * 0.55), crossPaint);
    canvas.drawLine(Offset(w * 0.29, h * 0.48), Offset(w * 0.43, h * 0.48), crossPaint);

    // Front Cab
    final cabPath = Path()
      ..moveTo(w * 0.58, h * 0.4)
      ..lineTo(w * 0.76, h * 0.4)
      ..quadraticBezierTo(w * 0.88, h * 0.52, w * 0.88, h * 0.7)
      ..lineTo(w * 0.58, h * 0.7)
      ..close();
    final cabPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF2DD4BF), Color(0xFF0F766E)],
      ).createShader(Rect.fromLTWH(w * 0.58, h * 0.4, w * 0.3, h * 0.3));
    canvas.drawPath(cabPath, cabPaint);

    // Windshield
    final winPath = Path()
      ..moveTo(w * 0.62, h * 0.44)
      ..lineTo(w * 0.74, h * 0.44)
      ..quadraticBezierTo(w * 0.82, h * 0.52, w * 0.82, h * 0.56)
      ..lineTo(w * 0.62, h * 0.56)
      ..close();
    final winPaint = Paint()..color = const Color(0xFFCCFBF1);
    canvas.drawPath(winPath, winPaint);

    // Wheels
    final wheelPaint = Paint()..color = const Color(0xFF1E293B);
    final rimPaint = Paint()..color = const Color(0xFF94A3B8);

    canvas.drawCircle(Offset(w * 0.28, h * 0.72), w * 0.1, wheelPaint);
    canvas.drawCircle(Offset(w * 0.28, h * 0.72), w * 0.045, rimPaint);

    canvas.drawCircle(Offset(w * 0.72, h * 0.72), w * 0.1, wheelPaint);
    canvas.drawCircle(Offset(w * 0.72, h * 0.72), w * 0.045, rimPaint);

    // Speed streaks
    final streakPaint = Paint()
      ..color = const Color(0xFF2DD4BF).withOpacity(0.65)
      ..strokeWidth = w * 0.03
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.02, h * 0.36), Offset(w * 0.09, h * 0.36), streakPaint);
    canvas.drawLine(Offset(w * 0.05, h * 0.48), Offset(w * 0.10, h * 0.48), streakPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Modern 3D Notification Bell Icon
class ModernNotificationBellIcon extends StatelessWidget {
  final double size;
  const ModernNotificationBellIcon({super.key, this.size = 32});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        size: Size(size, size),
        painter: _NotificationBellPainter(),
      ),
    );
  }
}

class _NotificationBellPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Top loop
    final loopPaint = Paint()
      ..color = const Color(0xFF7C3AED)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.06;
    canvas.drawCircle(Offset(w * 0.5, h * 0.18), w * 0.06, loopPaint);

    // Bell body
    final bellPath = Path()
      ..moveTo(w * 0.5, h * 0.2)
      ..quadraticBezierTo(w * 0.34, h * 0.24, w * 0.32, h * 0.52)
      ..quadraticBezierTo(w * 0.2, h * 0.66, w * 0.18, h * 0.72)
      ..lineTo(w * 0.82, h * 0.72)
      ..quadraticBezierTo(w * 0.8, h * 0.66, w * 0.68, h * 0.52)
      ..quadraticBezierTo(w * 0.66, h * 0.24, w * 0.5, h * 0.2)
      ..close();

    final bellPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFA78BFA), Color(0xFF6D28D9)],
      ).createShader(Rect.fromLTWH(w * 0.18, h * 0.2, w * 0.64, h * 0.52));
    canvas.drawPath(bellPath, bellPaint);

    // Clapper
    final clapperPaint = Paint()..color = const Color(0xFF4C1D95);
    canvas.drawCircle(Offset(w * 0.5, h * 0.78), w * 0.08, clapperPaint);

    // Highlight
    final glossPaint = Paint()
      ..color = Colors.white.withOpacity(0.55)
      ..strokeWidth = w * 0.04
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.38, h * 0.34), Offset(w * 0.34, h * 0.58), glossPaint);

    // Notification alert red/pink badge
    final ringPaint = Paint()..color = Colors.white;
    canvas.drawCircle(Offset(w * 0.76, h * 0.26), w * 0.13, ringPaint);

    final dotPaint = Paint()
      ..shader = const RadialGradient(
        colors: [Color(0xFFFB7185), Color(0xFFE11D48)],
      ).createShader(Rect.fromCircle(center: Offset(w * 0.76, h * 0.26), radius: w * 0.1));
    canvas.drawCircle(Offset(w * 0.76, h * 0.26), w * 0.1, dotPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

