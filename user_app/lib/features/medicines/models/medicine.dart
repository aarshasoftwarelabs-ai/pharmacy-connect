class Medicine {
  final String id;
  final String name;
  final String dosage;
  final int currentStock;
  final int dosagePerDay;
  final DateTime createdAt;

  Medicine({
    required this.id,
    required this.name,
    required this.dosage,
    required this.currentStock,
    required this.dosagePerDay,
    required this.createdAt,
  });

  // Calculate remaining days
  int get remainingDays {
    if (dosagePerDay <= 0) return 999;
    return (currentStock / dosagePerDay).floor();
  }

  // Check if refill is needed (3 days or less)
  bool get needsRefill {
    return remainingDays <= 3;
  }

  factory Medicine.fromJson(Map<String, dynamic> json) {
    return Medicine(
      id: json['id'] as String,
      name: json['name'] as String,
      dosage: json['dosage'] as String,
      currentStock: json['currentStock'] as int,
      dosagePerDay: json['dosagePerDay'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'dosage': dosage,
      'currentStock': currentStock,
      'dosagePerDay': dosagePerDay,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
