import 'package:go_router/go_router.dart';
import '../screens/auth/login_screen.dart';
import '../screens/rider/dashboard_screen.dart';
import '../screens/rider/requests_list_screen.dart';
import '../screens/rider/request_detail_screen.dart';
import '../screens/rider/active_delivery_screen.dart';
import '../providers/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// App router configuration with auth guards
/// 
/// Defines all routes and handles authentication-based navigation.
/// Structure allows future customer and admin routes.
GoRouter createRouter(WidgetRef ref) {
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);
      final isAuthenticated = authState.isAuthenticated;
      final isRider = authState.isRider;
      final isLoginRoute = state.matchedLocation == '/login';

      // Redirect to login if not authenticated and trying to access protected route
      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }

      // Redirect to dashboard if authenticated and on login page
      if (isAuthenticated && isLoginRoute) {
        if (isRider) {
          return '/rider/dashboard';
        }
        // Future: handle customer and admin redirects
        return '/login';
      }

      // Allow access to rider routes only if authenticated as rider
      if (isAuthenticated && state.matchedLocation.startsWith('/rider/')) {
        if (!isRider) {
          return '/login';
        }
      }

      return null;
    },
    routes: [
      // Auth routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Rider routes
      GoRoute(
        path: '/rider/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/rider/requests',
        builder: (context, state) => const RequestsListScreen(),
      ),
      GoRoute(
        path: '/rider/requests/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return RequestDetailScreen(deliveryId: id);
        },
      ),
      GoRoute(
        path: '/rider/active',
        builder: (context, state) => const ActiveDeliveryScreen(),
      ),

      // Future: Customer routes
      // GoRoute(
      //   path: '/customer/...',
      //   ...
      // ),

      // Future: Admin routes
      // GoRoute(
      //   path: '/admin/...',
      //   ...
      // ),
    ],
  );
}

