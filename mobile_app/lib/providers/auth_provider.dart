import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart' show StateNotifierProvider;
import 'package:state_notifier/state_notifier.dart' show StateNotifier;
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

/// Auth state model
class AuthState {
  final firebase_auth.User? firebaseUser;
  final User? dbUser;
  final bool isLoading;
  final String? error;

  AuthState({
    this.firebaseUser,
    this.dbUser,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => firebaseUser != null && dbUser != null;
  bool get isRider => dbUser?.role.toString() == 'rider';

  AuthState copyWith({
    firebase_auth.User? firebaseUser,
    User? dbUser,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      firebaseUser: firebaseUser ?? this.firebaseUser,
      dbUser: dbUser ?? this.dbUser,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Auth service provider
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

/// API service provider
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

/// Auth state notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final ApiService _apiService;

  AuthNotifier(this._authService, this._apiService)
      : super(AuthState()) {
    // Listen to auth state changes
    _authService.authStateChanges.listen((firebaseUser) {
      if (firebaseUser != null) {
        _syncUser(firebaseUser);
      } else {
        state = AuthState();
      }
    });
  }

  /// Sign in with email and password
  Future<void> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final credential = await _authService.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      if (credential.user != null) {
        await _syncUser(credential.user!);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  /// Sync Firebase user with database user
  Future<void> _syncUser(firebase_auth.User firebaseUser) async {
    try {
      final idToken = await firebaseUser.getIdToken();
      if (idToken == null) {
        state = state.copyWith(isLoading: false, error: 'Failed to get ID token');
        return;
      }

      // Verify token and get user from backend
      final dbUser = await _apiService.verifyToken(idToken);
      
      state = state.copyWith(
        firebaseUser: firebaseUser,
        dbUser: dbUser,
        isLoading: false,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Sign out
  Future<void> signOut() async {
    state = state.copyWith(isLoading: true);
    try {
      await _authService.signOut();
      state = AuthState();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  /// Get ID token
  Future<String?> getIdToken() async {
    return await _authService.getIdToken();
  }

  /// Refresh user data
  Future<void> refreshUser() async {
    final firebaseUser = state.firebaseUser;
    if (firebaseUser != null) {
      await _syncUser(firebaseUser);
    }
  }
}

/// Auth notifier provider
final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final apiService = ref.watch(apiServiceProvider);
  return AuthNotifier(authService, apiService);
});

