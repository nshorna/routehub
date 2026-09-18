import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';

/// Firebase Auth service wrapper
/// 
/// Handles authentication operations including sign in, token management,
/// and sign out. Provides a clean interface for Firebase Auth operations.
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Get current user
  User? get currentUser => _auth.currentUser;

  /// Get auth state stream
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Sign in with email and password
  /// 
  /// Returns the user credential on success, throws exception on failure.
  Future<UserCredential> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    print('🚀 [FRONTEND] User attempting to sign in with email: $email');
    
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      print('✅ [FRONTEND] Sign in successful for user: ${credential.user?.uid}');
      return credential;
    } on FirebaseAuthException catch (e) {
      print('❌ [FRONTEND] Sign in failed: ${e.code} - ${e.message}');
      rethrow;
    } catch (e) {
      print('❌ [FRONTEND] Unexpected sign in error: $e');
      rethrow;
    }
  }

  /// Get ID token for authenticated user
  /// 
  /// Returns the ID token string, or null if user is not authenticated.
  /// Automatically refreshes token if expired.
  Future<String?> getIdToken({bool forceRefresh = false}) async {
    final user = _auth.currentUser;
    if (user == null) {
      print('❌ [FRONTEND] No authenticated user to get token');
      return null;
    }

    try {
      final token = await user.getIdToken(forceRefresh);
      print('✅ [FRONTEND] ID token retrieved${forceRefresh ? ' (forced refresh)' : ''}');
      return token;
    } catch (e) {
      print('❌ [FRONTEND] Failed to get ID token: $e');
      return null;
    }
  }

  /// Sign out current user
  Future<void> signOut() async {
    print('🚀 [FRONTEND] User signing out');
    try {
      await _auth.signOut();
      print('✅ [FRONTEND] Sign out successful');
    } catch (e) {
      print('❌ [FRONTEND] Sign out failed: $e');
      rethrow;
    }
  }

  /// Check if user is authenticated
  bool get isAuthenticated => _auth.currentUser != null;
}

