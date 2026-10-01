class Pharmacy {
  final String id;
  final String name;
  final String address;
  final bool isConnected;

  Pharmacy({
    required this.id,
    required this.name,
    required this.address,
    this.isConnected = false,
  });
}
