/// API endpoints and base URL configuration
/// 
/// Base URL defaults to localhost for development.
/// For production, update the baseUrl constant.
class ApiEndpoints {
  // Base API URL - update for production
  // For local development with emulator: 'http://10.0.2.2:3000' (Android) or 'http://localhost:3000' (iOS)
  // For production: 'https://your-api-domain.com'
  static const String baseUrl = 'http://172.20.10.4:3011';
  
  // Auth endpoints
  static const String verifyToken = '/api/auth/verify';
  static const String getUser = '/api/auth/user';
  
  // Rider endpoints
  static const String currentRider = '/api/riders/current';
  static const String riderRequests = '/api/rider/requests';
  static const String riderActiveDelivery = '/api/rider/active-delivery';
  static String riderOnlineStatus(String riderId) => '/api/riders/$riderId/online-status';
  static String acceptDelivery(String deliveryId) => '/api/rider/deliveries/$deliveryId/accept';
  static String rejectDelivery(String deliveryId) => '/api/rider/deliveries/$deliveryId/reject';
  static String deliveryStatus(String deliveryId) => '/api/deliveries/$deliveryId/status';
  static String deliveryPins(String orderId) => '/api/rider/deliveries/$orderId/pins';
  
  /// Build full URL from endpoint path
  static String buildUrl(String endpoint) {
    return '$baseUrl$endpoint';
  }
}

