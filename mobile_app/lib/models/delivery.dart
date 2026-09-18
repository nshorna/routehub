/// Delivery data model matching web app Delivery interface
class Delivery {
  final String id;
  final String orderId;
  final String pickupAddress;
  final double? pickupLatitude;
  final double? pickupLongitude;
  final String dropoffAddress;
  final double? dropoffLatitude;
  final double? dropoffLongitude;
  final double fee;
  final DeliveryStatus status;
  final DateTime createdAt;
  final String? riderId;
  final String? riderName;
  final String? customerId;
  final String? customerPhone;
  final String? sellerId;
  final String? notes;

  Delivery({
    required this.id,
    required this.orderId,
    required this.pickupAddress,
    this.pickupLatitude,
    this.pickupLongitude,
    required this.dropoffAddress,
    this.dropoffLatitude,
    this.dropoffLongitude,
    required this.fee,
    required this.status,
    required this.createdAt,
    this.riderId,
    this.riderName,
    this.customerId,
    this.customerPhone,
    this.sellerId,
    this.notes,
  });

  /// Create Delivery from JSON
  factory Delivery.fromJson(Map<String, dynamic> json) {
    return Delivery(
      id: json['id'] as String,
      orderId: json['orderId'] as String,
      pickupAddress: json['pickupAddress'] as String,
      pickupLatitude: json['pickupLatitude'] as double?,
      pickupLongitude: json['pickupLongitude'] as double?,
      dropoffAddress: json['dropoffAddress'] as String,
      dropoffLatitude: json['dropoffLatitude'] as double?,
      dropoffLongitude: json['dropoffLongitude'] as double?,
      fee: (json['fee'] as num).toDouble(),
      status: DeliveryStatus.fromString(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      riderId: json['riderId'] as String?,
      riderName: json['riderName'] as String?,
      customerId: json['customerId'] as String?,
      customerPhone: json['customerPhone'] as String?,
      sellerId: json['sellerId'] as String?,
      notes: json['notes'] as String?,
    );
  }

  /// Convert Delivery to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'pickupAddress': pickupAddress,
      'pickupLatitude': pickupLatitude,
      'pickupLongitude': pickupLongitude,
      'dropoffAddress': dropoffAddress,
      'dropoffLatitude': dropoffLatitude,
      'dropoffLongitude': dropoffLongitude,
      'fee': fee,
      'status': status.toString(),
      'createdAt': createdAt.toIso8601String(),
      'riderId': riderId,
      'riderName': riderName,
      'customerId': customerId,
      'customerPhone': customerPhone,
      'sellerId': sellerId,
      'notes': notes,
    };
  }
}

/// Delivery status enum
enum DeliveryStatus {
  pending,
  pickedUp,
  inTransit,
  delivered,
  cancelled;

  /// Create from string (handles both camelCase and kebab-case)
  factory DeliveryStatus.fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return DeliveryStatus.pending;
      case 'picked-up':
      case 'pickedup':
        return DeliveryStatus.pickedUp;
      case 'in-transit':
      case 'intransit':
        return DeliveryStatus.inTransit;
      case 'delivered':
        return DeliveryStatus.delivered;
      case 'cancelled':
      case 'canceled':
        return DeliveryStatus.cancelled;
      default:
        return DeliveryStatus.pending;
    }
  }

  @override
  String toString() {
    switch (this) {
      case DeliveryStatus.pending:
        return 'pending';
      case DeliveryStatus.pickedUp:
        return 'picked-up';
      case DeliveryStatus.inTransit:
        return 'in-transit';
      case DeliveryStatus.delivered:
        return 'delivered';
      case DeliveryStatus.cancelled:
        return 'cancelled';
    }
  }
}

