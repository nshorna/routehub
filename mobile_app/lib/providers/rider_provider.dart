import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart' show StateNotifierProvider;
import 'package:state_notifier/state_notifier.dart';
import '../models/rider.dart';
import '../models/delivery.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

/// Rider state model
class RiderState {
  final Rider? rider;
  final bool isLoading;
  final String? error;

  RiderState({
    this.rider,
    this.isLoading = false,
    this.error,
  });

  RiderState copyWith({
    Rider? rider,
    bool? isLoading,
    String? error,
  }) {
    return RiderState(
      rider: rider ?? this.rider,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Delivery requests state
class DeliveryRequestsState {
  final List<Delivery> requests;
  final bool isLoading;
  final String? error;

  DeliveryRequestsState({
    this.requests = const [],
    this.isLoading = false,
    this.error,
  });

  DeliveryRequestsState copyWith({
    List<Delivery>? requests,
    bool? isLoading,
    String? error,
  }) {
    return DeliveryRequestsState(
      requests: requests ?? this.requests,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Active delivery state
class ActiveDeliveryState {
  final Delivery? delivery;
  final bool isLoading;
  final String? error;

  ActiveDeliveryState({
    this.delivery,
    this.isLoading = false,
    this.error,
  });

  ActiveDeliveryState copyWith({
    Delivery? delivery,
    bool? isLoading,
    String? error,
  }) {
    return ActiveDeliveryState(
      delivery: delivery ?? this.delivery,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Rider notifier
class RiderNotifier extends StateNotifier<RiderState> {
  final ApiService _apiService;
  final Ref _ref;

  RiderNotifier(this._apiService, this._ref) : super(RiderState());

  /// Load current rider
  Future<void> loadRider() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final token = await _ref.read(authNotifierProvider.notifier).getIdToken();
      
      if (token == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Not authenticated',
        );
        return;
      }

      final rider = await _apiService.getCurrentRider(token);
      state = state.copyWith(rider: rider, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Update online status
  Future<void> updateOnlineStatus(bool isOnline) async {
    if (state.rider == null) return;
    
    state = state.copyWith(isLoading: true);
    
    try {
      final token = await _ref.read(authNotifierProvider.notifier).getIdToken();
      
      if (token == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Not authenticated',
        );
        return;
      }

      final updatedRider = await _apiService.updateOnlineStatus(
        state.rider!.id,
        isOnline,
        token,
      );
      
      state = state.copyWith(rider: updatedRider, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }
}

/// Delivery requests notifier
class DeliveryRequestsNotifier extends StateNotifier<DeliveryRequestsState> {
  final ApiService _apiService;
  final Ref _ref;

  DeliveryRequestsNotifier(this._apiService, this._ref)
      : super(DeliveryRequestsState());

  /// Load delivery requests
  Future<void> loadRequests() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final token = await _ref.read(authNotifierProvider.notifier).getIdToken();
      
      if (token == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Not authenticated',
        );
        return;
      }

      final requests = await _apiService.getRiderRequests(token);
      state = state.copyWith(requests: requests, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }
}

/// Active delivery notifier
class ActiveDeliveryNotifier extends StateNotifier<ActiveDeliveryState> {
  final ApiService _apiService;
  final Ref _ref;

  ActiveDeliveryNotifier(this._apiService, this._ref)
      : super(ActiveDeliveryState());

  /// Load active delivery
  Future<void> loadActiveDelivery() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final token = await _ref.read(authNotifierProvider.notifier).getIdToken();
      
      if (token == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Not authenticated',
        );
        return;
      }

      final delivery = await _apiService.getActiveDelivery(token);
      state = state.copyWith(delivery: delivery, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Accept delivery
  Future<void> acceptDelivery(String deliveryId) async {
    state = state.copyWith(isLoading: true);
    
    try {
      final token = await _ref.read(authNotifierProvider.notifier).getIdToken();
      
      if (token == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Not authenticated',
        );
        return;
      }

      final delivery = await _apiService.acceptDelivery(deliveryId, token);
      state = state.copyWith(delivery: delivery, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  /// Reject delivery
  Future<void> rejectDelivery(String deliveryId) async {
    state = state.copyWith(isLoading: true);
    
    try {
      final token = await _ref.read(authNotifierProvider.notifier).getIdToken();
      
      if (token == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Not authenticated',
        );
        return;
      }

      await _apiService.rejectDelivery(deliveryId, token);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  /// Update delivery status
  Future<void> updateDeliveryStatus(String deliveryId, String status) async {
    state = state.copyWith(isLoading: true);
    
    try {
      final token = await _ref.read(authNotifierProvider.notifier).getIdToken();
      
      if (token == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'Not authenticated',
        );
        return;
      }

      final delivery = await _apiService.updateDeliveryStatus(
        deliveryId,
        status,
        token,
      );
      state = state.copyWith(delivery: delivery, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }
}

/// Rider notifier provider
final riderNotifierProvider =
    StateNotifierProvider<RiderNotifier, RiderState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return RiderNotifier(apiService, ref);
});

/// Delivery requests notifier provider
final deliveryRequestsNotifierProvider =
    StateNotifierProvider<DeliveryRequestsNotifier, DeliveryRequestsState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return DeliveryRequestsNotifier(apiService, ref);
});

/// Active delivery notifier provider
final activeDeliveryNotifierProvider =
    StateNotifierProvider<ActiveDeliveryNotifier, ActiveDeliveryState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ActiveDeliveryNotifier(apiService, ref);
});

