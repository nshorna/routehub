/// Rider data model matching web app Rider interface
class Rider {
  final String id;
  final String name;
  final String phone;
  final String email;
  final String bikeInfo;
  final String? ghanaCardName;
  final String? ghanaCardNumber;
  final String? dateOfBirth;
  final String? licenseNumber;
  final String? licenseExpiration;
  final bool? hasSmartphone;
  final bool? hasGhanaNumber;
  final RiderStatus? status;
  final double earnings;
  final int completedDeliveries;
  final bool isOnline;
  final Location? currentLocation;
  final double pendingPayout;

  Rider({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.bikeInfo,
    this.ghanaCardName,
    this.ghanaCardNumber,
    this.dateOfBirth,
    this.licenseNumber,
    this.licenseExpiration,
    this.hasSmartphone,
    this.hasGhanaNumber,
    this.status,
    required this.earnings,
    required this.completedDeliveries,
    required this.isOnline,
    this.currentLocation,
    required this.pendingPayout,
  });

  /// Create Rider from JSON
  factory Rider.fromJson(Map<String, dynamic> json) {
    return Rider(
      id: json['id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String,
      email: json['email'] as String,
      bikeInfo: json['bikeInfo'] as String,
      ghanaCardName: json['ghanaCardName'] as String?,
      ghanaCardNumber: json['ghanaCardNumber'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      licenseNumber: json['licenseNumber'] as String?,
      licenseExpiration: json['licenseExpiration'] as String?,
      hasSmartphone: json['hasSmartphone'] as bool?,
      hasGhanaNumber: json['hasGhanaNumber'] as bool?,
      status: json['status'] != null
          ? RiderStatus.fromString(json['status'] as String)
          : null,
      earnings: (json['earnings'] as num?)?.toDouble() ?? 0.0,
      completedDeliveries: json['completedDeliveries'] as int? ?? 0,
      isOnline: json['isOnline'] as bool? ?? false,
      currentLocation: json['currentLocation'] != null
          ? Location.fromJson(json['currentLocation'] as Map<String, dynamic>)
          : null,
      pendingPayout: (json['pendingPayout'] as num?)?.toDouble() ?? 0.0,
    );
  }

  /// Convert Rider to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'bikeInfo': bikeInfo,
      'ghanaCardName': ghanaCardName,
      'ghanaCardNumber': ghanaCardNumber,
      'dateOfBirth': dateOfBirth,
      'licenseNumber': licenseNumber,
      'licenseExpiration': licenseExpiration,
      'hasSmartphone': hasSmartphone,
      'hasGhanaNumber': hasGhanaNumber,
      'status': status?.toString(),
      'earnings': earnings,
      'completedDeliveries': completedDeliveries,
      'isOnline': isOnline,
      'currentLocation': currentLocation?.toJson(),
      'pendingPayout': pendingPayout,
    };
  }
}

/// Rider status enum
enum RiderStatus {
  pendingApproval,
  approved,
  rejected,
  inactive,
  active,
  suspended;

  factory RiderStatus.fromString(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING_APPROVAL':
        return RiderStatus.pendingApproval;
      case 'APPROVED':
        return RiderStatus.approved;
      case 'REJECTED':
        return RiderStatus.rejected;
      case 'INACTIVE':
        return RiderStatus.inactive;
      case 'ACTIVE':
        return RiderStatus.active;
      case 'SUSPENDED':
        return RiderStatus.suspended;
      default:
        return RiderStatus.pendingApproval;
    }
  }

  @override
  String toString() {
    switch (this) {
      case RiderStatus.pendingApproval:
        return 'PENDING_APPROVAL';
      case RiderStatus.approved:
        return 'APPROVED';
      case RiderStatus.rejected:
        return 'REJECTED';
      case RiderStatus.inactive:
        return 'INACTIVE';
      case RiderStatus.active:
        return 'ACTIVE';
      case RiderStatus.suspended:
        return 'SUSPENDED';
    }
  }
}

/// Location model for coordinates
class Location {
  final double lat;
  final double lng;

  Location({required this.lat, required this.lng});

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lat': lat,
      'lng': lng,
    };
  }
}

