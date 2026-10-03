import 'package:flutter/material.dart';
import 'package:custom_refresh_indicator/custom_refresh_indicator.dart';

class AppRefreshIndicator extends StatelessWidget {
  final Future<void> Function() onRefresh;
  final Widget child;

  const AppRefreshIndicator({
    super.key,
    required this.onRefresh,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return CustomRefreshIndicator(
      onRefresh: onRefresh,
      builder: (BuildContext context, Widget child, IndicatorController controller) {
        return Stack(
          alignment: Alignment.topCenter,
          children: <Widget>[
            child,
            if (!controller.isIdle)
              Positioned(
                top: -60.0 + (110.0 * controller.value),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Colors.black12, blurRadius: 10, spreadRadius: 1)
                    ],
                  ),
                  child: Transform.rotate(
                    angle: controller.value * 3.14 * 2,
                    child: const Icon(
                      Icons.medication_rounded,
                      color: Color(0xFF0F766E),
                      size: 26,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
      child: child,
    );
  }
}
