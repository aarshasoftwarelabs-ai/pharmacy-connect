import 'package:flutter_test/flutter_test.dart';
import 'package:pharmacy_mobile/main.dart';
import 'package:pharmacy_mobile/core/services/storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('DavaSetuApp smoke test', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await StorageService.init();

    await tester.pumpWidget(const DavaSetuApp());
    expect(find.text('DavaSetu Pharmacy'), findsWidgets);
  });
}
