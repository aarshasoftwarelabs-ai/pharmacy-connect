import 'package:flutter/material.dart';
import '../../widgets/animated_toast.dart';

class UiUtils {
  static void showCustomSnackBar(BuildContext context, String message, {bool isError = false}) {
    // Instead of ScaffoldMessenger, we use an OverlayEntry for the custom animation
    final overlayState = Overlay.of(context);
    OverlayEntry? overlayEntry;

    overlayEntry = OverlayEntry(
      builder: (context) => AnimatedToast(
        message: message,
        isError: isError,
        onDismissed: () {
          overlayEntry?.remove();
        },
      ),
    );

    overlayState.insert(overlayEntry);
  }
}

