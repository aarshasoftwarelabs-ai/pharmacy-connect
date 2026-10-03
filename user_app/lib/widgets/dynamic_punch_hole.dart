import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:google_fonts/google_fonts.dart';

// This is a singleton manager so we can trigger the punch hole island from anywhere in the app
class DynamicPunchHoleController extends ChangeNotifier {
  static final DynamicPunchHoleController instance = DynamicPunchHoleController._();
  DynamicPunchHoleController._();

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _notificationTitle;
  String? _notificationMessage;
  IconData? _notificationIcon;
  Color? _notificationColor;
  bool _showNotification = false;

  // Stored info for manual trigger
  String? _latestTitle;
  String? _latestMessage;
  IconData? _latestIcon;
  Color? _latestColor;

  bool get showNotification => _showNotification;
  String? get notificationTitle => _notificationTitle;
  String? get notificationMessage => _notificationMessage;
  IconData? get notificationIcon => _notificationIcon;
  Color? get notificationColor => _notificationColor;

  void setLatestInfo({
    required String title,
    required String message,
    required IconData icon,
    required Color color,
  }) {
    _latestTitle = title;
    _latestMessage = message;
    _latestIcon = icon;
    _latestColor = color;
  }

  void toggleIsland() {
    if (_showNotification) {
      hideIsland();
    } else {
      if (_latestTitle != null) {
        showIslandNotification(
          title: _latestTitle!,
          message: _latestMessage!,
          icon: _latestIcon!,
          color: _latestColor!,
          autoHide: true,
        );
      }
    }
  }

  void hideIsland() {
    if (_showNotification) {
      _showNotification = false;
      notifyListeners();
    }
  }

  void startLoading() {
    _isLoading = true;
    notifyListeners();
  }

  void stopLoading() {
    _isLoading = false;
    notifyListeners();
  }

  void showIslandNotification({
    required String title,
    required String message,
    required IconData icon,
    Color color = const Color(0xFF10B981),
    bool autoHide = true,
  }) {
    _notificationTitle = title;
    _notificationMessage = message;
    _notificationIcon = icon;
    _notificationColor = color;
    _showNotification = true;
    notifyListeners();

    if (autoHide) {
      // Auto hide after 6 seconds so user can read it properly
      Future.delayed(const Duration(seconds: 6), () {
        if (_showNotification && _notificationTitle == title) {
          hideIsland();
        }
      });
    }
  }
}

class DynamicPunchHole extends StatefulWidget {
  final Widget child;
  const DynamicPunchHole({super.key, required this.child});

  @override
  State<DynamicPunchHole> createState() => _DynamicPunchHoleState();
}

class _DynamicPunchHoleState extends State<DynamicPunchHole> with TickerProviderStateMixin {
  late AnimationController _orbitController;
  late AnimationController _islandController;
  late Animation<double> _islandHeight;
  late Animation<double> _islandWidth;

  @override
  void initState() {
    super.initState();
    _orbitController = AnimationController(vsync: this, duration: const Duration(seconds: 2));
    _islandController = AnimationController(
      vsync: this, 
      duration: const Duration(milliseconds: 1200), // slower, bouncy drop down
      reverseDuration: const Duration(milliseconds: 800), // smooth slide back up
    );

    _islandHeight = Tween<double>(begin: 30.0, end: 84.0).animate(
      CurvedAnimation(parent: _islandController, curve: Curves.elasticOut)
    );
    _islandWidth = Tween<double>(begin: 100.0, end: 340.0).animate(
      CurvedAnimation(parent: _islandController, curve: Curves.elasticOut)
    );

    DynamicPunchHoleController.instance.addListener(_onStateChanged);
  }

  void _onStateChanged() {
    if (DynamicPunchHoleController.instance.isLoading) {
      if (!_orbitController.isAnimating) _orbitController.repeat();
    } else {
      _orbitController.stop();
    }

    if (DynamicPunchHoleController.instance.showNotification) {
      _islandController.forward(from: 0.0);
    } else {
      _islandController.reverse();
    }
    
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    DynamicPunchHoleController.instance.removeListener(_onStateChanged);
    _orbitController.dispose();
    _islandController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // We assume Android top-center punch hole. 
    // Usually status bar height is around 24-40px depending on the device.
    final double topPadding = MediaQuery.of(context).padding.top;
    final double punchHoleCenterY = topPadding > 0 ? (topPadding / 2) + 4 : 24.0;
    
    return Stack(
      children: [
        widget.child, // The main app content

        // 3. The Orbit Progress Ring
        if (DynamicPunchHoleController.instance.isLoading)
          Positioned(
            top: punchHoleCenterY - 20, // Center around the punch hole
            left: 0,
            right: 0,
            child: IgnorePointer(
              child: Center(
                child: AnimatedBuilder(
                  animation: _orbitController,
                  builder: (context, child) {
                    return Transform.rotate(
                      angle: _orbitController.value * 2 * math.pi,
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: const BoxDecoration(shape: BoxShape.circle),
                        child: Stack(
                          children: [
                            Positioned(
                              top: 0, left: 16,
                              child: _buildGlowingDot(const Color(0xFF10B981)),
                            ),
                            Positioned(
                              bottom: 0, left: 16,
                              child: _buildGlowingDot(const Color(0xFF3B82F6)),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

        // 2. Invisible touch target for manual trigger
        Positioned(
          top: 0,
          left: MediaQuery.of(context).size.width / 2 - 50,
          child: GestureDetector(
            onTap: () {
              DynamicPunchHoleController.instance.toggleIsland();
            },
            onVerticalDragEnd: (details) {
              if (details.primaryVelocity != null && details.primaryVelocity! > 0) {
                // Swipe down
                if (!DynamicPunchHoleController.instance.showNotification) {
                  DynamicPunchHoleController.instance.toggleIsland();
                }
              }
            },
            child: Container(
              width: 100,
              height: punchHoleCenterY + 30,
              color: Colors.transparent, // Invisible but tappable!
            ),
          ),
        ),

        // 1. Dynamic Island
        if (_islandController.value > 0)
          Positioned(
            top: punchHoleCenterY - 15,
            left: 0,
            right: 0,
            child: Center(
              child: AnimatedBuilder(
                animation: _islandController,
                builder: (context, child) {
                  return GestureDetector(
                    onVerticalDragEnd: (details) {
                      if (details.primaryVelocity != null && details.primaryVelocity! < 0) {
                        // Swipe up to dismiss
                        DynamicPunchHoleController.instance.hideIsland();
                      }
                    },
                    child: Container(
                      width: _islandWidth.value,
                      height: _islandHeight.value,
                      decoration: BoxDecoration(
                        color: Colors.black, // True black blends with punch hole
                        borderRadius: BorderRadius.circular(42),
                      boxShadow: [
                        BoxShadow(
                          color: DynamicPunchHoleController.instance.notificationColor?.withOpacity(0.3) ?? Colors.black26,
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: SingleChildScrollView(
                      physics: const NeverScrollableScrollPhysics(),
                      child: Opacity(
                        opacity: (_islandController.value - 0.5).clamp(0.0, 1.0) * 2, // fade in late
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: DynamicPunchHoleController.instance.notificationColor?.withOpacity(0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  DynamicPunchHoleController.instance.notificationIcon,
                                  color: DynamicPunchHoleController.instance.notificationColor,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      DynamicPunchHoleController.instance.notificationTitle ?? '',
                                      style: GoogleFonts.outfit(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        decoration: TextDecoration.none,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      DynamicPunchHoleController.instance.notificationMessage ?? '',
                                      style: GoogleFonts.inter(
                                        color: Colors.white70,
                                        fontSize: 13,
                                        fontWeight: FontWeight.normal,
                                        decoration: TextDecoration.none,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildGlowingDot(Color color) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.8),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
    );
  }
}
