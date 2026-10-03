import 'package:flutter/material.dart';

class BlinkitLoader extends StatefulWidget {
  final double size;
  const BlinkitLoader({super.key, this.size = 50.0});

  @override
  State<BlinkitLoader> createState() => _BlinkitLoaderState();
}

class _BlinkitLoaderState extends State<BlinkitLoader> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  
  final List<IconData> _icons = [
    Icons.medication_rounded,
    Icons.vaccines_rounded,
    Icons.local_pharmacy_rounded,
  ];

  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() {
          _currentIndex = (_currentIndex + 1) % _icons.length;
        });
        _controller.forward(from: 0.0);
      }
    });
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            double scale = 1.0;
            double opacity = 1.0;
            
            // Pop in
            if (_controller.value < 0.2) {
              scale = _controller.value / 0.2;
              opacity = scale;
            } 
            // Stay
            else if (_controller.value < 0.8) {
              scale = 1.0;
              opacity = 1.0;
            }
            // Pop out
            else {
              scale = (1.0 - _controller.value) / 0.2;
              opacity = scale;
            }

            return Transform.scale(
              scale: scale,
              child: Opacity(
                opacity: opacity.clamp(0.0, 1.0),
                child: Icon(
                  _icons[_currentIndex],
                  color: const Color(0xFF0F766E), // Teal 700
                  size: widget.size * 0.55,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
