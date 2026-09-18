import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/rider_provider.dart';
import '../../constants/app_colors.dart';
import '../../widgets/loading_indicator.dart';
import '../../models/delivery.dart';

/// Request detail screen
/// 
/// Shows full delivery details with map, route info, and accept/reject actions.
class RequestDetailScreen extends ConsumerStatefulWidget {
  final String deliveryId;

  const RequestDetailScreen({
    super.key,
    required this.deliveryId,
  });

  @override
  ConsumerState<RequestDetailScreen> createState() => _RequestDetailScreenState();
}

class _RequestDetailScreenState extends ConsumerState<RequestDetailScreen> {
  Delivery? _delivery;
  bool _isLoading = true;
  bool _isProcessing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Defer provider modifications until after the build phase
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDelivery();
      _checkActiveDelivery();
    });
  }

  Future<void> _loadDelivery() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      print('📤 [FRONTEND] Loading delivery details: ${widget.deliveryId}');
      await ref.read(deliveryRequestsNotifierProvider.notifier).loadRequests();
      final requestsState = ref.read(deliveryRequestsNotifierProvider);
      final delivery = requestsState.requests.firstWhere(
        (d) => d.id == widget.deliveryId,
        orElse: () => throw Exception('Delivery not found'),
      );
      
      setState(() {
        _delivery = delivery;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ [FRONTEND] Failed to load delivery: $e');
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _checkActiveDelivery() async {
    try {
      await ref
          .read(activeDeliveryNotifierProvider.notifier)
          .loadActiveDelivery();
      
      final activeDeliveryState = ref.read(activeDeliveryNotifierProvider);
      if (activeDeliveryState.delivery != null && mounted) {
        print('⚠️ [FRONTEND] User already has active delivery');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'You already have an active delivery. Please complete it before accepting a new one.',
            ),
            backgroundColor: AppColors.warning,
          ),
        );
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            context.go('/rider/active');
          }
        });
      }
    } catch (e) {
      // Silently fail - user can still try to accept
      print('⚠️ [FRONTEND] Failed to check active delivery: $e');
    }
  }

  Future<void> _acceptDelivery() async {
    if (_delivery == null || _isProcessing) return;

    // Double-check for active delivery
    await _checkActiveDelivery();

    setState(() {
      _isProcessing = true;
    });

    try {
      print('🚀 [FRONTEND] User accepting delivery: ${_delivery!.id}');
      await ref
          .read(activeDeliveryNotifierProvider.notifier)
          .acceptDelivery(_delivery!.id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Delivery accepted! Redirecting...'),
            backgroundColor: AppColors.success,
          ),
        );
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            context.go('/rider/active');
          }
        });
      }
    } catch (e) {
      print('❌ [FRONTEND] Failed to accept delivery: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Future<void> _rejectDelivery() async {
    if (_delivery == null || _isProcessing) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      print('🚀 [FRONTEND] User rejecting delivery: ${_delivery!.id}');
      await ref
          .read(activeDeliveryNotifierProvider.notifier)
          .rejectDelivery(_delivery!.id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Delivery rejected. Returning to requests...'),
            backgroundColor: AppColors.error,
          ),
        );
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            context.go('/rider/requests');
          }
        });
      }
    } catch (e) {
      print('❌ [FRONTEND] Failed to reject delivery: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Future<void> _openGoogleMaps(String address) async {
    final url = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(address)}',
    );
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery Request Details'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.primaryForeground,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: _isLoading
          ? const LoadingIndicator(message: 'Loading delivery details...')
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Error: $_error',
                        style: const TextStyle(color: AppColors.error),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadDelivery,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _delivery == null
                  ? const Center(child: Text('Delivery not found'))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Order ID
                          Text(
                            'Order ID: ${_delivery!.orderId}',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                          ),
                          const SizedBox(height: 16),

                          // Map placeholder (TODO: Integrate Google Maps)
                          Container(
                            height: 200,
                            decoration: BoxDecoration(
                              color: AppColors.border,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.map,
                                    size: 48,
                                    color: AppColors.mutedForeground,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Map View',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: AppColors.mutedForeground,
                                        ),
                                  ),
                                  const SizedBox(height: 8),
                                  ElevatedButton.icon(
                                    onPressed: () {
                                      _openGoogleMaps(_delivery!.pickupAddress);
                                    },
                                    icon: const Icon(Icons.open_in_new),
                                    label: const Text('Open in Google Maps'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Delivery details card
                          Card(
                            elevation: 2,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Delivery Information',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  const SizedBox(height: 16),

                                  // Pickup location
                                  _LocationRow(
                                    label: 'From',
                                    address: _delivery!.pickupAddress,
                                    color: AppColors.pickupMarker,
                                    onMapTap: () => _openGoogleMaps(_delivery!.pickupAddress),
                                  ),
                                  const SizedBox(height: 16),

                                  // Dropoff location
                                  _LocationRow(
                                    label: 'To',
                                    address: _delivery!.dropoffAddress,
                                    color: AppColors.dropoffMarker,
                                    onMapTap: () => _openGoogleMaps(_delivery!.dropoffAddress),
                                  ),
                                  const Divider(height: 32),

                                  // Delivery fee
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Delivery Fee',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyLarge
                                            ?.copyWith(
                                              color: AppColors.mutedForeground,
                                            ),
                                      ),
                                      Text(
                                        '\$${_delivery!.fee.toStringAsFixed(2)}',
                                        style: Theme.of(context)
                                            .textTheme
                                            .headlineSmall
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.primary,
                                            ),
                                      ),
                                    ],
                                  ),

                                  // Notes if available
                                  if (_delivery!.notes != null) ...[
                                    const Divider(height: 32),
                                    Text(
                                      'Special Instructions',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      _delivery!.notes!,
                                      style: Theme.of(context).textTheme.bodyMedium,
                                    ),
                                  ],

                                  // Customer phone if available
                                  if (_delivery!.customerPhone != null) ...[
                                    const Divider(height: 32),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.phone,
                                          color: AppColors.primary,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _delivery!.customerPhone!,
                                            style: Theme.of(context).textTheme.bodyLarge,
                                          ),
                                        ),
                                        TextButton(
                                          onPressed: () async {
                                            final url = Uri.parse(
                                              'tel:${_delivery!.customerPhone}',
                                            );
                                            if (await canLaunchUrl(url)) {
                                              await launchUrl(url);
                                            }
                                          },
                                          child: const Text('Call'),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Action buttons
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: _isProcessing ? null : _rejectDelivery,
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.destructive,
                                    side: const BorderSide(color: AppColors.destructive),
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                  ),
                                  child: const Text('Reject'),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                flex: 2,
                                child: ElevatedButton(
                                  onPressed: _isProcessing ? null : _acceptDelivery,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: AppColors.primaryForeground,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                  ),
                                  child: _isProcessing
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor: AlwaysStoppedAnimation<Color>(
                                              AppColors.primaryForeground,
                                            ),
                                          ),
                                        )
                                      : const Text(
                                          'Accept Delivery',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
    );
  }
}

/// Location row widget
class _LocationRow extends StatelessWidget {
  final String label;
  final String address;
  final Color color;
  final VoidCallback onMapTap;

  const _LocationRow({
    required this.label,
    required this.address,
    required this.color,
    required this.onMapTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.location_on,
            size: 20,
            color: Colors.white,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.mutedForeground,
                      fontWeight: FontWeight.w500,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                address,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
        ),
        IconButton(
          icon: const Icon(Icons.map),
          onPressed: onMapTap,
          color: AppColors.primary,
        ),
      ],
    );
  }
}

