import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/sponsored_banner_model.dart';
import '../providers/promotion_provider.dart';
import '../core/constants/app_colors.dart';

class PharmaSponsoredBannerWidget extends StatefulWidget {
  const PharmaSponsoredBannerWidget({super.key});

  @override
  State<PharmaSponsoredBannerWidget> createState() => _PharmaSponsoredBannerWidgetState();
}

class _PharmaSponsoredBannerWidgetState extends State<PharmaSponsoredBannerWidget> {
  late final PageController _pageController;
  Timer? _autoScrollTimer;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.94);

    // Fetch active banners on launch
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PromotionProvider>().fetchBanners();
    });

    _startAutoScroll();
  }

  void _startAutoScroll() {
    _autoScrollTimer?.cancel();
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      final banners = context.read<PromotionProvider>().banners;
      if (banners.isEmpty || !_pageController.hasClients) return;

      final nextPage = (_currentPage + 1) % banners.length;
      _pageController.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 650),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  Color _parseColor(String hex, Color defaultColor) {
    try {
      final clean = hex.replaceAll('#', '').trim();
      if (clean.length == 6) {
        return Color(int.parse('0xFF$clean'));
      }
    } catch (_) {}
    return defaultColor;
  }

  void _handleBannerAction(BuildContext context, SponsoredBannerModel banner) {
    HapticFeedback.lightImpact();
    context.read<PromotionProvider>().recordClick(banner.id);

    _showSchemeDetailsModal(context, banner);
  }

  void _showSchemeDetailsModal(BuildContext context, SponsoredBannerModel banner) {
    final startColor = _parseColor(banner.bgGradientStart, const Color(0xFF059669));
    final endColor = _parseColor(banner.bgGradientEnd, const Color(0xFF047857));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Tag
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [startColor, endColor]),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.verified_rounded, size: 14, color: Colors.white),
                        const SizedBox(width: 4),
                        Text(
                          banner.badgeText,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                banner.companyName,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: startColor,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                banner.title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              if (banner.schemeOffer != null && banner.schemeOffer!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: startColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: startColor.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.local_offer_rounded, size: 20, color: startColor),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          banner.schemeOffer!,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: startColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (banner.description != null && banner.description!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  banner.description!,
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                ),
              ],
              if (banner.contactPerson != null && banner.contactPerson!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.person_pin_circle_rounded, size: 16, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    Text(
                      'Distributor Contact: ${banner.contactPerson}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 22),
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF25D366), // WhatsApp Green
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 1,
                      ),
                      icon: const Icon(Icons.chat_rounded, size: 18),
                      label: const Text(
                        'WhatsApp Inquiry',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        final phone = banner.actionValue?.replaceAll(RegExp(r'[^0-9]'), '') ?? '919876543210';
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            backgroundColor: const Color(0xFF25D366),
                            content: Text('📱 WhatsApp Booking requested for "${banner.title}" (Phone: +$phone)'),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: startColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 1,
                    ),
                    icon: const Icon(Icons.phone_rounded, size: 18),
                    label: const Text(
                      'Call',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () {
                      Navigator.pop(ctx);
                      final phone = banner.actionValue ?? '9876543210';
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: startColor,
                          content: Text('📞 Calling Distributor at $phone...'),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final promoProvider = context.watch<PromotionProvider>();
    final banners = promoProvider.banners;

    if (banners.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.workspace_premium_rounded, size: 18, color: Color(0xFFD97706)), // Amber gold
                  SizedBox(width: 6),
                  Text(
                    'Pharma Deals & Schemes',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.2,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'B2B Wholesale',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFB45309),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // Carousel Slider
        SizedBox(
          height: 154,
          child: PageView.builder(
            controller: _pageController,
            itemCount: banners.length,
            onPageChanged: (index) {
              setState(() => _currentPage = index);
              promoProvider.recordImpression(banners[index].id);
            },
            itemBuilder: (context, index) {
              final banner = banners[index];
              final startColor = _parseColor(banner.bgGradientStart, const Color(0xFF059669));
              final endColor = _parseColor(banner.bgGradientEnd, const Color(0xFF047857));

              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 5),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: LinearGradient(
                    colors: [startColor, endColor],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: startColor.withValues(alpha: 0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => _handleBannerAction(context, banner),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Stack(
                        children: [
                          // Background Decorative Icon
                          Positioned(
                            right: -10,
                            bottom: -10,
                            child: Icon(
                              Icons.medication_rounded,
                              size: 110,
                              color: Colors.white.withValues(alpha: 0.12),
                            ),
                          ),

                          // Banner Content
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // Top Row: Company & Badge
                              Row(
                                children: [
                                  Expanded(
                                    child: Row(
                                      children: [
                                        const Icon(Icons.verified_rounded, size: 14, color: Colors.amberAccent),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            banner.companyName,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.22),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                                    ),
                                    child: Text(
                                      banner.badgeText,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              // Middle: Title & Scheme
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    banner.title,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: -0.2,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    banner.schemeOffer ?? banner.description ?? '',
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.9),
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),

                              // Bottom Row: Action Pill & Tap Cue
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          banner.actionType == 'WHATSAPP'
                                              ? Icons.chat_rounded
                                              : Icons.phone_rounded,
                                          size: 13,
                                          color: startColor,
                                        ),
                                        const SizedBox(width: 5),
                                        Text(
                                          banner.actionType == 'WHATSAPP' ? 'Book on WhatsApp' : 'Call Stockist',
                                          style: TextStyle(
                                            color: startColor,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      Text(
                                        'View Deal',
                                        style: TextStyle(
                                          color: Colors.white.withValues(alpha: 0.85),
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(width: 2),
                                      Icon(
                                        Icons.arrow_forward_ios_rounded,
                                        size: 10,
                                        color: Colors.white.withValues(alpha: 0.85),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 8),

        // Indicator Dots
        if (banners.length > 1)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(banners.length, (index) {
              final isCurrent = index == _currentPage;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: isCurrent ? 18 : 6,
                height: 5,
                decoration: BoxDecoration(
                  color: isCurrent ? AppColors.primary : AppColors.textMuted.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
      ],
    );
  }
}
