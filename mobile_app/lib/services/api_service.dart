import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_endpoints.dart';
import '../models/delivery.dart';
import '../models/rider.dart';
import '../models/user.dart';

/// API service for making HTTP requests to the backend
/// 
/// Handles all API calls with Bearer token authentication.
/// Includes console logs for debugging and tracing API calls.
class ApiService {
  /// Make authenticated GET request
  Future<http.Response> _get(String endpoint, String? token) async {
    final url = ApiEndpoints.buildUrl(endpoint);
    print('📤 [FRONTEND] Sending GET request to: $url');
    
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    try {
      final response = await http.get(Uri.parse(url), headers: headers);
      print('📥 [API] Received response from $url: ${response.statusCode}');
      return response;
    } catch (e) {
      print('❌ [API] GET request failed for $url: $e');
      rethrow;
    }
  }

  /// Make authenticated POST request
  Future<http.Response> _post(
    String endpoint,
    Map<String, dynamic>? body,
    String? token,
  ) async {
    final url = ApiEndpoints.buildUrl(endpoint);
    print('📤 [FRONTEND] Sending POST request to: $url');
    
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      print('📥 [API] Received response from $url: ${response.statusCode}');
      return response;
    } catch (e) {
      print('❌ [API] POST request failed for $url: $e');
      rethrow;
    }
  }

  /// Make authenticated PATCH request
  Future<http.Response> _patch(
    String endpoint,
    Map<String, dynamic>? body,
    String? token,
  ) async {
    final url = ApiEndpoints.buildUrl(endpoint);
    print('📤 [FRONTEND] Sending PATCH request to: $url');
    
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    try {
      final response = await http.patch(
        Uri.parse(url),
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      print('📥 [API] Received response from $url: ${response.statusCode}');
      return response;
    } catch (e) {
      print('❌ [API] PATCH request failed for $url: $e');
      rethrow;
    }
  }

  /// Verify Firebase token with backend
  Future<User> verifyToken(String idToken) async {
    print('📤 [FRONTEND] Sending POST request to verify token...');
    
    final response = await _post(
      ApiEndpoints.verifyToken,
      {'idToken': idToken},
      null,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      print('✅ [API] Token verified successfully');
      return User.fromJson(data['user'] as Map<String, dynamic>);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Token verification failed: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to verify token');
    }
  }

  /// Get current user information
  Future<User> getCurrentUser(String token) async {
    print('📤 [FRONTEND] Fetching current user...');
    
    final response = await _get(ApiEndpoints.getUser, token);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      print('✅ [API] Current user retrieved');
      return User.fromJson(data['user'] as Map<String, dynamic>);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Failed to get current user: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to get current user');
    }
  }

  /// Get current rider information
  Future<Rider> getCurrentRider(String token) async {
    print('📤 [FRONTEND] Fetching current rider...');
    
    final response = await _get(ApiEndpoints.currentRider, token);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      print('✅ [API] Current rider retrieved');
      return Rider.fromJson(data['rider'] as Map<String, dynamic>);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Failed to get current rider: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to get current rider');
    }
  }

  /// Get available delivery requests
  Future<List<Delivery>> getRiderRequests(String token) async {
    print('📤 [FRONTEND] Fetching delivery requests...');
    
    final response = await _get(ApiEndpoints.riderRequests, token);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List<dynamic>;
      print('✅ [API] Retrieved ${data.length} delivery requests');
      return data.map((json) => Delivery.fromJson(json as Map<String, dynamic>)).toList();
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Failed to get delivery requests: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to get delivery requests');
    }
  }

  /// Check if rider has active delivery
  Future<Delivery?> getActiveDelivery(String token) async {
    print('📤 [FRONTEND] Checking for active delivery...');
    
    final response = await _get(ApiEndpoints.riderActiveDelivery, token);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (data['hasActiveDelivery'] == true && data['delivery'] != null) {
        print('✅ [API] Active delivery found');
        return Delivery.fromJson(data['delivery'] as Map<String, dynamic>);
      } else {
        print('✅ [API] No active delivery');
        return null;
      }
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Failed to check active delivery: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to check active delivery');
    }
  }

  /// Accept a delivery request
  Future<Delivery> acceptDelivery(String deliveryId, String token) async {
    print('🚀 [FRONTEND] User accepting delivery: $deliveryId');
    print('📤 [FRONTEND] Sending POST request to accept delivery...');
    
    final response = await _post(
      ApiEndpoints.acceptDelivery(deliveryId),
      null,
      token,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      print('✅ [API] Delivery accepted successfully');
      return Delivery.fromJson(data as Map<String, dynamic>);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Failed to accept delivery: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to accept delivery');
    }
  }

  /// Reject a delivery request
  Future<void> rejectDelivery(String deliveryId, String token) async {
    print('🚀 [FRONTEND] User rejecting delivery: $deliveryId');
    print('📤 [FRONTEND] Sending POST request to reject delivery...');
    
    final response = await _post(
      ApiEndpoints.rejectDelivery(deliveryId),
      null,
      token,
    );

    if (response.statusCode == 200) {
      print('✅ [API] Delivery rejected successfully');
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Failed to reject delivery: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to reject delivery');
    }
  }

  /// Update delivery status
  Future<Delivery> updateDeliveryStatus(
    String deliveryId,
    String status,
    String token,
  ) async {
    print('🚀 [FRONTEND] User updating delivery status: $deliveryId to $status');
    print('📤 [FRONTEND] Sending PATCH request to update status...');
    
    final response = await _patch(
      ApiEndpoints.deliveryStatus(deliveryId),
      {'status': status},
      token,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      print('✅ [API] Delivery status updated successfully');
      return Delivery.fromJson(data as Map<String, dynamic>);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Failed to update delivery status: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to update delivery status');
    }
  }

  /// Toggle rider online status
  Future<Rider> updateOnlineStatus(
    String riderId,
    bool isOnline,
    String token,
  ) async {
    print('🚀 [FRONTEND] User toggling online status: $isOnline');
    print('📤 [FRONTEND] Sending PATCH request to update online status...');
    
    final response = await _patch(
      ApiEndpoints.riderOnlineStatus(riderId),
      {'isOnline': isOnline},
      token,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      print('✅ [API] Online status updated successfully');
      return Rider.fromJson(data['rider'] as Map<String, dynamic>);
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Failed to update online status: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to update online status');
    }
  }

  /// Get delivery confirmation PINs
  Future<Map<String, String?>> getDeliveryPins(String orderId, String token) async {
    print('📤 [FRONTEND] Fetching delivery PINs for order: $orderId');
    
    final response = await _get(ApiEndpoints.deliveryPins(orderId), token);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      print('✅ [API] Delivery PINs retrieved');
      return {
        'pickupConfirmationPin': data['pickupConfirmationPin'] as String?,
        'deliveryConfirmationPin': data['deliveryConfirmationPin'] as String?,
      };
    } else {
      final error = jsonDecode(response.body) as Map<String, dynamic>;
      print('❌ [API] Failed to get delivery PINs: ${error['error']}');
      throw Exception(error['error'] ?? 'Failed to get delivery PINs');
    }
  }
}

