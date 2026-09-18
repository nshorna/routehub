/// User/auth model with role support
class User {
  final String id;
  final String name;
  final String email;
  final String phone;
  final UserRole role;
  final UserStatus status;
  final DateTime createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.status,
    required this.createdAt,
  });

  /// Create User from JSON
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      role: UserRole.fromString(json['role'] as String? ?? ''),
      status: UserStatus.fromString(json['status'] as String? ?? 'pending'),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  /// Convert User to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role.toString(),
      'status': status.toString(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

/// User role enum
enum UserRole {
  rider,
  seller,
  customer,
  admin;

  factory UserRole.fromString(String role) {
    switch (role.toLowerCase()) {
      case 'rider':
      case 'courier':
        return UserRole.rider;
      case 'seller':
        return UserRole.seller;
      case 'customer':
        return UserRole.customer;
      case 'admin':
      case 'platform-admin':
        return UserRole.admin;
      default:
        return UserRole.rider;
    }
  }

  @override
  String toString() {
    switch (this) {
      case UserRole.rider:
        return 'rider';
      case UserRole.seller:
        return 'seller';
      case UserRole.customer:
        return 'customer';
      case UserRole.admin:
        return 'admin';
    }
  }
}

/// User status enum
enum UserStatus {
  pending,
  approved,
  rejected;

  factory UserStatus.fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return UserStatus.pending;
      case 'approved':
        return UserStatus.approved;
      case 'rejected':
        return UserStatus.rejected;
      default:
        return UserStatus.pending;
    }
  }

  @override
  String toString() {
    switch (this) {
      case UserStatus.pending:
        return 'pending';
      case UserStatus.approved:
        return 'approved';
      case UserStatus.rejected:
        return 'rejected';
    }
  }
}

