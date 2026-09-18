import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/rider_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../constants/app_colors.dart';
import '../../widgets/loading_indicator.dart';
import '../../models/delivery.dart';

/// Active delivery screen
/// 
/// Shows delivery progress, map tracking, confirmation PINs, and status updates.
class ActiveDeliveryScreen extends ConsumerStatefulWidget {
  const ActiveDeliveryScreen({super.key});

  @override
  ConsumerState<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends ConsumerState<ActiveDeliveryScreen> {
  Map<String, String?>? _pins;
  bool _loadingPins = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    print('🚀 [FRONTEND] Loading active delivery');
    await ref.read(activeDeliveryNotifierProvider.notifier).loadActiveDelivery();
    final state = ref.read(activeDeliveryNotifierProvider);
    if (state.delivery != null) {
      _loadPins(state.delivery!.orderId);
    }
  }

  Future<void> _loadPins(String orderId) async {
    setState(() {
      _loadingPins = true;
    });

    try {
      print('📤 [FRONTEND] Loading delivery PINs for order: $orderId');
      final token = await ref.read(authNotifierProvider.notifier).getIdToken();
      
      if (token == null) return;

      final apiService = ref.read(apiServiceProvider);
      _pins = await apiService.getDeliveryPins(orderId, token);
      print('✅ [FRONTEND] Delivery PINs loaded');
    } catch (e) {
      print('❌ [FRONTEND] Failed to load PINs: $e');
    } finally {
      setState(() {
        _loadingPins = false;
      });
    }
  }

  Future<void> _updateStatus(String status) async {
    final state = ref.read(activeDeliveryNotifierProvider);
    if (state.delivery == null) return;

    try {
      print('🚀 [FRONTEND] User updating delivery status to: $status');
      await ref
          .read(activeDeliveryNotifierProvider.notifier)
          .updateDeliveryStatus(state.delivery!.id, status);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status updated to $status'),
            backgroundColor: AppColors.success,
          ),
        );
      }

      // Reload data
      await _loadData();
    } catch (e) {
      print('❌ [FRONTEND] Failed to update status: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _openGoogleMaps(String address, {double? lat, double? lng}) async {
    final url = lat != null && lng != null
        ? Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng')
        : Uri.parse(
            'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(address)}',
          );
    
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  int _getStepFromStatus(DeliveryStatus status) {
    switch (status) {
      case DeliveryStatus.pending:
        return 1;
      case DeliveryStatus.pickedUp:
        return 2;
      case DeliveryStatus.inTransit:
        return 3;
      case DeliveryStatus.delivered:
        return 4;
      case DeliveryStatus.cancelled:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(activeDeliveryNotifierProvider);

    if (state.isLoading && state.delivery == null) {
      return const Scaffold(
        body: LoadingIndicator(message: 'Loading active delivery...'),
      );
    }

    if (state.delivery == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Active Delivery'),
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.primaryForeground,
        ),
        body: Center(
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
                'No Active Delivery',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Check the requests tab to accept new deliveries',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.mutedForeground,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.push('/rider/requests'),
                child: const Text('View Requests'),
              ),
            ],
          ),
        ),
      );
    }

    final delivery = state.delivery!;
    final currentStep = _getStepFromStatus(delivery.status);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Delivery'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.primaryForeground,
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Order ID
              Text(
                'Order ID: ${delivery.orderId}',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.mutedForeground,
                    ),
              ),
              const SizedBox(height: 16),

              // Map placeholder
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
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () {
                          if (delivery.status == DeliveryStatus.pending) {
                            _openGoogleMaps(
                              delivery.pickupAddress,
                              lat: delivery.pickupLatitude,
                              lng: delivery.pickupLongitude,
                            );
                          } else {
                            _openGoogleMaps(
                              delivery.dropoffAddress,
                              lat: delivery.dropoffLatitude,
                              lng: delivery.dropoffLongitude,
                            );
                          }
                        },
                        icon: const Icon(Icons.navigation),
                        label: Text(
                          delivery.status == DeliveryStatus.pending
                              ? 'Open Google Maps to Pickup'
                              : 'Open Google Maps to Delivery',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Delivery progress steps
              Text(
                'Delivery Progress',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 16),
              _ProgressSteps(
                currentStep: currentStep,
                delivery: delivery,
              ),
              const SizedBox(height: 24),

              // Delivery details
              Card(
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Delivery Details',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 16),
                      _LocationRow(
                        label: 'From',
                        address: delivery.pickupAddress,
                        color: AppColors.pickupMarker,
                        onMapTap: () => _openGoogleMaps(
                          delivery.pickupAddress,
                          lat: delivery.pickupLatitude,
                          lng: delivery.pickupLongitude,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _LocationRow(
                        label: 'To',
                        address: delivery.dropoffAddress,
                        color: AppColors.dropoffMarker,
                        onMapTap: () => _openGoogleMaps(
                          delivery.dropoffAddress,
                          lat: delivery.dropoffLatitude,
                          lng: delivery.dropoffLongitude,
                        ),
                      ),
                      const Divider(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Delivery Fee',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: AppColors.mutedForeground,
                                ),
                          ),
                          Text(
                            '\$${delivery.fee.toStringAsFixed(2)}',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Confirmation PINs
              if (_pins != null) _ConfirmationPinsSection(pins: _pins!, delivery: delivery),
              const SizedBox(height: 24),

              // Customer contact
              if (delivery.customerPhone != null)
                Card(
                  elevation: 2,
                  child: ListTile(
                    leading: Icon(Icons.phone, color: AppColors.primary),
                    title: const Text('Customer Contact'),
                    subtitle: Text(delivery.customerPhone!),
                    trailing: IconButton(
                      icon: const Icon(Icons.call),
                      onPressed: () async {
                        final url = Uri.parse('tel:${delivery.customerPhone}');
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url);
                        }
                      },
                    ),
                  ),
                ),
              const SizedBox(height: 24),

              // Action buttons based on step
              if (currentStep == 2)
                ElevatedButton(
                  onPressed: () => _updateStatus('IN_TRANSIT'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.primaryForeground,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    minimumSize: const Size(double.infinity, 0),
                  ),
                  child: const Text(
                    'Start Delivery (Go to Drop-off)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Progress steps widget
class _ProgressSteps extends StatelessWidget {
  final int currentStep;
  final Delivery delivery;

  const _ProgressSteps({
    required this.currentStep,
    required this.delivery,
  });

  @override
  Widget build(BuildContext context) {
    final steps = [
      {'number': 1, 'label': 'Go to Pickup', 'description': 'Navigate to the pickup location'},
      {'number': 2, 'label': 'Picked Up', 'description': 'Confirm you\'ve picked up the package'},
      {'number': 3, 'label': 'Go to Drop-off', 'description': 'Navigate to the drop-off location'},
      {'number': 4, 'label': 'Delivered', 'description': 'Confirm successful delivery'},
    ];

    return Column(
      children: steps.map((step) {
        final stepNumber = step['number'] as int;
        final isCompleted = currentStep > stepNumber;
        final isCurrent = currentStep == stepNumber;

        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isCompleted || isCurrent
                      ? AppColors.primary
                      : AppColors.border,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, color: Colors.white, size: 20)
                      : Text(
                          '${step['number']}',
                          style: TextStyle(
                            color: isCurrent || isCompleted
                                ? Colors.white
                                : AppColors.mutedForeground,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          step['label'] as String,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: isCompleted || isCurrent
                                    ? AppColors.foreground
                                    : AppColors.mutedForeground,
                              ),
                        ),
                        if (isCurrent) ...[
                          const SizedBox(width: 8),
                          Text(
                            '(Current)',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.primary,
                                ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      step['description'] as String,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.mutedForeground,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
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
          child: const Icon(Icons.location_on, size: 20, color: Colors.white),
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

/// Confirmation PINs section
class _ConfirmationPinsSection extends StatelessWidget {
  final Map<String, String?> pins;
  final Delivery delivery;

  const _ConfirmationPinsSection({
    required this.pins,
    required this.delivery,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Confirmation PINs',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        if (pins['pickupConfirmationPin'] != null &&
            delivery.status == DeliveryStatus.pending)
          Card(
            color: Colors.blue.shade50,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Pickup Confirmation PIN',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.blue.shade700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    pins['pickupConfirmationPin']!,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade700,
                          letterSpacing: 4,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Share this PIN with the seller to confirm pickup',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.blue.shade700,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        if (pins['deliveryConfirmationPin'] != null &&
            (delivery.status == DeliveryStatus.pickedUp ||
                delivery.status == DeliveryStatus.inTransit))
          Card(
            color: Colors.green.shade50,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Delivery Confirmation PIN',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.green.shade700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    pins['deliveryConfirmationPin']!,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
                          letterSpacing: 4,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Share this PIN with the customer to confirm delivery',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.green.shade700,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

