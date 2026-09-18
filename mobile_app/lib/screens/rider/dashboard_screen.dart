import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/rider_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/rider.dart';
import '../../constants/app_colors.dart';
import '../../widgets/loading_indicator.dart';
import 'package:intl/intl.dart';

/// Rider dashboard screen
/// 
/// Displays rider stats, online/offline toggle, and quick action buttons.
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Load rider data and check for active delivery on mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(riderNotifierProvider.notifier).loadRider();
      ref.read(activeDeliveryNotifierProvider.notifier).loadActiveDelivery();
    });
  }

  Future<void> _refreshData() async {
    print('🚀 [FRONTEND] User pulled to refresh dashboard');
    await ref.read(riderNotifierProvider.notifier).loadRider();
    await ref.read(activeDeliveryNotifierProvider.notifier).loadActiveDelivery();
  }

  @override
  Widget build(BuildContext context) {
    final riderState = ref.watch(riderNotifierProvider);
    final activeDeliveryState = ref.watch(activeDeliveryNotifierProvider);
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.primaryForeground,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              print('🚀 [FRONTEND] User signing out');
              await ref.read(authNotifierProvider.notifier).signOut();
              if (mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshData,
        child: riderState.isLoading && riderState.rider == null
            ? const LoadingIndicator(message: 'Loading dashboard...')
            : riderState.error != null && riderState.rider == null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Error: ${riderState.error}',
                          style: const TextStyle(color: AppColors.error),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            ref.read(riderNotifierProvider.notifier).loadRider();
                          },
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Welcome message
                        if (riderState.rider != null)
                          _WelcomeSection(
                            riderName: riderState.rider!.name,
                          ),
                        const SizedBox(height: 24),

                        // Online/Offline toggle
                        if (riderState.rider != null)
                          _OnlineStatusCard(
                            isOnline: riderState.rider!.isOnline,
                            isLoading: riderState.isLoading,
                            onToggle: (value) {
                              print('🚀 [FRONTEND] User toggling online status: $value');
                              ref
                                  .read(riderNotifierProvider.notifier)
                                  .updateOnlineStatus(value);
                            },
                          ),
                        const SizedBox(height: 24),

                        // Stats grid
                        if (riderState.rider != null)
                          _StatsGrid(rider: riderState.rider!),
                        const SizedBox(height: 24),

                        // Quick actions
                        _QuickActionsSection(
                          hasActiveDelivery:
                              activeDeliveryState.delivery != null,
                          newRequestsCount: 0, // Will be loaded from requests screen
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }
}

/// Welcome section widget
class _WelcomeSection extends StatelessWidget {
  final String riderName;

  const _WelcomeSection({required this.riderName});

  @override
  Widget build(BuildContext context) {
    final firstName = riderName.split(' ').first;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Welcome back, $firstName!',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          'Manage your deliveries and earnings',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.mutedForeground,
              ),
        ),
      ],
    );
  }
}

/// Online status card widget
class _OnlineStatusCard extends StatelessWidget {
  final bool isOnline;
  final bool isLoading;
  final ValueChanged<bool> onToggle;

  const _OnlineStatusCard({
    required this.isOnline,
    required this.isLoading,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Status',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isOnline
                        ? 'Online and accepting deliveries'
                        : 'Offline - not accepting deliveries',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: isOnline
                              ? AppColors.primary
                              : AppColors.mutedForeground,
                        ),
                  ),
                ],
              ),
            ),
            Switch(
              value: isOnline,
              onChanged: isLoading ? null : onToggle,
            ),
          ],
        ),
      ),
    );
  }
}

/// Stats grid widget
class _StatsGrid extends StatelessWidget {
  final Rider rider;

  const _StatsGrid({required this.rider});

  @override
  Widget build(BuildContext context) {
    final completedToday = 0; // TODO: Calculate from deliveries
    final avgEarningsPerDelivery = rider.completedDeliveries > 0
        ? rider.earnings / rider.completedDeliveries
        : 0.0;
    final todayEarnings = avgEarningsPerDelivery * completedToday;

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _StatCard(
          title: "Today's Earnings",
          value: '\$${todayEarnings.toStringAsFixed(2)}',
          subtitle: '$completedToday deliver${completedToday == 1 ? "y" : "ies"} completed today',
          icon: Icons.trending_up,
          color: AppColors.primary,
        ),
        _StatCard(
          title: 'Total Deliveries',
          value: '${rider.completedDeliveries}',
          subtitle: 'Completed deliveries',
          icon: Icons.local_shipping,
          color: AppColors.primary,
        ),
        _StatCard(
          title: 'Total Earnings',
          value: '\$${rider.earnings.toStringAsFixed(2)}',
          subtitle: 'All-time earnings',
          icon: Icons.check_circle,
          color: AppColors.primary,
        ),
        _StatCard(
          title: 'Pending Payout',
          value: '\$${rider.pendingPayout.toStringAsFixed(2)}',
          subtitle: 'Ready for withdrawal',
          icon: Icons.account_balance_wallet,
          color: AppColors.accent,
        ),
      ],
    );
  }
}

/// Stat card widget
class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.mutedForeground,
                      ),
                ),
                Icon(icon, size: 20, color: color),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.mutedForeground,
                        fontSize: 11,
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

/// Quick actions section widget
class _QuickActionsSection extends StatelessWidget {
  final bool hasActiveDelivery;
  final int newRequestsCount;

  const _QuickActionsSection({
    required this.hasActiveDelivery,
    required this.newRequestsCount,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                title: 'View New Requests',
                subtitle: '$newRequestsCount new deliver${newRequestsCount == 1 ? "y" : "ies"} available',
                icon: Icons.local_shipping,
                color: AppColors.primary,
                onTap: () {
                  context.push('/rider/requests');
                },
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _QuickActionCard(
                title: 'View Active Delivery',
                subtitle: hasActiveDelivery
                    ? '1 delivery in progress'
                    : 'No delivery in progress',
                icon: Icons.location_on,
                color: AppColors.accent,
                onTap: () {
                  context.push('/rider/active');
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Quick action card widget
class _QuickActionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      color: color,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: Colors.white, size: 32),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white70,
                      fontSize: 11,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

