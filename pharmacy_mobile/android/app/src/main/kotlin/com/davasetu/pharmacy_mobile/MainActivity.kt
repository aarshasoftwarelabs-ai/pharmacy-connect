package com.davasetu.pharmacy_mobile

import android.content.Intent
import android.net.Uri
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.davasetu.pharmacy_mobile/upi"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "launchUpi") {
                val uriStr = call.argument<String>("uri")
                val packageName = call.argument<String>("package")
                if (uriStr != null) {
                    try {
                        val uri = Uri.parse(uriStr)
                        val intent = Intent(Intent.ACTION_VIEW, uri)
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

                        if (!packageName.isNullOrEmpty()) {
                            try {
                                intent.setPackage(packageName)
                                startActivity(intent)
                                result.success(true)
                                return@setMethodCallHandler
                            } catch (_: Exception) {
                                // Specific app not found, fall back to chooser below
                                intent.setPackage(null)
                            }
                        }

                        val chooser = Intent.createChooser(intent, "Pay ₹1,499 with UPI App")
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        startActivity(chooser)
                        result.success(true)
                    } catch (e: Exception) {
                        try {
                            val uri = Uri.parse(uriStr)
                            val fallbackIntent = Intent(Intent.ACTION_VIEW, uri)
                            fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            startActivity(fallbackIntent)
                            result.success(true)
                        } catch (e2: Exception) {
                            result.error("UPI_LAUNCH_FAILED", e2.message, null)
                        }
                    }
                } else {
                    result.error("INVALID_URI", "URI cannot be null", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }
}
