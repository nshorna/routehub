import 'package:flutter/material.dart';
import '../models/delivery.dart';
import '../constants/app_colors.dart';

/// Reusable delivery card widget
/// 
/// Displays delivery information in a card format.
/// No padding/margin - applied at usage site.
class DeliveryCard extends StatelessWidget {
  final Delivery delivery;
  final VoidCallback? onTap;

  const DeliveryCard({
    super.key,
    required this.delivery,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: AppColors.border),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pickup and Dropoff locations
            Row(
              children: [
                Expanded(
                  child: _LocationSection(
                    label: 'Pickup',
                    address: delivery.pickupAddress,
                    color: AppColors.pickupMarker,
                  ),
                ),
                Expanded(
                  child: _LocationSection(
                    label: 'Dropoff',
                    address: delivery.dropoffAddress,
                    color: AppColors.dropoffMarker,
                  ),
                ),
              ],
            ),
            const Divider(height: 1),
            // Order ID and Fee
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Order ID',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        delivery.orderId,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Delivery Fee',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.mutedForeground,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '\$${delivery.fee.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Location section widget
class _LocationSection extends StatelessWidget {
  final String label;
  final String address;
  final Color color;

  const _LocationSection({
    required this.label,
    required this.address,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.location_on,
                  size: 16,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.mutedForeground,
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            address,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

