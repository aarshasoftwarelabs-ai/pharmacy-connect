import 'package:flutter/material.dart';

class FadeInSlide extends StatelessWidget {
  final Widget child;
  final double delay;
  final Duration duration;

  const FadeInSlide({
    Key? key,
    required this.child,
    this.delay = 0,
    this.duration = const Duration(milliseconds: 500),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return child;
  }
}
