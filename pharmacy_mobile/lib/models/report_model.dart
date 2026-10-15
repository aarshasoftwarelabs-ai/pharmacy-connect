class TopMedicineItem {
  final String medicineName;
  final int quantitySold;
  final double totalSales;

  TopMedicineItem({
    required this.medicineName,
    required this.quantitySold,
    required this.totalSales,
  });

  factory TopMedicineItem.fromJson(Map<String, dynamic> json) {
    return TopMedicineItem(
      medicineName: json['medicineName'] ?? json['name'] ?? 'Medicine',
      quantitySold: json['quantitySold'] is int
          ? json['quantitySold']
          : int.tryParse('${json['quantitySold']}') ?? 0,
      totalSales: json['totalSales'] != null
          ? (json['totalSales'] as num).toDouble()
          : 0.0,
    );
  }
}

class SalesReportModel {
  final double totalSales;
  final double totalDiscount;
  final double netSales;
  final double netProfit;
  final int totalBills;
  final double averageBillValue;
  final List<TopMedicineItem> topMedicines;

  SalesReportModel({
    this.totalSales = 0.0,
    this.totalDiscount = 0.0,
    this.netSales = 0.0,
    this.netProfit = 0.0,
    this.totalBills = 0,
    this.averageBillValue = 0.0,
    this.topMedicines = const [],
  });

  factory SalesReportModel.fromJson(Map<String, dynamic> json) {
    var rawList = json['topMedicines'] as List? ?? [];
    return SalesReportModel(
      totalSales: json['totalSales'] != null
          ? (json['totalSales'] as num).toDouble()
          : 0.0,
      totalDiscount: json['totalDiscount'] != null
          ? (json['totalDiscount'] as num).toDouble()
          : 0.0,
      netSales: json['netSales'] != null
          ? (json['netSales'] as num).toDouble()
          : 0.0,
      netProfit: json['netProfit'] != null
          ? (json['netProfit'] as num).toDouble()
          : 0.0,
      totalBills: json['totalBills'] is int
          ? json['totalBills']
          : int.tryParse('${json['totalBills']}') ?? 0,
      averageBillValue: json['averageBillValue'] != null
          ? (json['averageBillValue'] as num).toDouble()
          : 0.0,
      topMedicines:
          rawList.map((item) => TopMedicineItem.fromJson(item)).toList(),
    );
  }
}
