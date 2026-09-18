import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/rider_provider.dart';
import '../../constants/app_colors.dart';
import '../../widgets/loading_indicator.dart';
import '../../widgets/delivery_card.dart';

/// Delivery requests list screen
/// 
/// Displays available delivery requests with auto-refresh every 15 seconds.
class RequestsListScreen extends ConsumerStatefulWidget {
  const RequestsListScreen({super.key});

  @override
  ConsumerState<RequestsListScreen> createState() => _RequestsListScreenState();
}

class _RequestsListScreenState extends ConsumerState<RequestsListScreen> {
  @override
  void initState() {
    super.initState();
    // Load requests on mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadRequests();
    });
  }

  void _loadRequests() {
    print('🚀 [FRONTEND] Loading delivery requests');
    ref.read(deliveryRequestsNotifierProvider.notifier).loadRequests();
  }

  Future<void> _refreshRequests() async {
    print('🚀 [FRONTEND] User pulled to refresh requests');
    await ref.read(deliveryRequestsNotifierProvider.notifier).loadRequests();
  }

  @override
  Widget build(BuildContext context) {
    final requestsState = ref.watch(deliveryRequestsNotifierProvider);

    // Auto-refresh every 15 seconds
    ref.listen(deliveryRequestsNotifierProvider, (previous, next) {
      if (mounted) {
        Future.delayed(const Duration(seconds: 15), () {
          if (mounted) {
            _loadRequests();
          }
        });
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Delivery Requests'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.primaryForeground,
      ),
      body: RefreshIndicator(
        onRefresh: _refreshRequests,
        child: requestsState.isLoading && requestsState.requests.isEmpty
            ? const LoadingIndicator(message: 'Loading requests...')
            : requestsState.error != null && requestsState.requests.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Error: ${requestsState.error}',
                          style: const TextStyle(color: AppColors.error),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadRequests,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : requestsState.requests.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.inbox,
                              size: 64,
                              color: AppColors.mutedForeground,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No delivery requests available',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppColors.mutedForeground,
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Check back later for new deliveries',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.mutedForeground,
                                  ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: requestsState.requests.length,
                        itemBuilder: (context, index) {
                          final delivery = requestsState.requests[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: DeliveryCard(
                              delivery: delivery,
                              onTap: () {
                                print('🚀 [FRONTEND] User tapped delivery: ${delivery.id}');
                                context.push('/rider/requests/${delivery.id}');
                              },
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}

