import 'dart:math';

class PricingCalculationResult {
  final int bricksNeeded;
  final double trolleysCount;
  final int cementBags;
  final int sandCuFt;
  final double totalEstimatedCost;

  PricingCalculationResult({
    required this.bricksNeeded,
    required this.trolleysCount,
    required this.cementBags,
    required this.sandCuFt,
    required this.totalEstimatedCost,
  });
}

class GstResult {
  final double taxableValue;
  final double cgst;
  final double sgst;
  final double totalTax;
  final double grandTotal;

  GstResult({
    required this.taxableValue,
    required this.cgst,
    required this.sgst,
    required this.totalTax,
    required this.grandTotal,
  });
}

class EstimatorEngine {
  /// 5% GST reverse-tax calculation matching Gurukripa production system
  static GstResult calculateReverseGst(double inclusiveTotal) {
    final taxable = (inclusiveTotal / 1.05).roundToDouble();
    final totalTax = inclusiveTotal - taxable;
    final cgst = (totalTax / 2).roundToDouble();
    final sgst = totalTax - cgst;

    return GstResult(
      taxableValue: taxable,
      cgst: cgst,
      sgst: sgst,
      totalTax: totalTax,
      grandTotal: inclusiveTotal,
    );
  }

  /// 3-in-1 Wall estimation formula
  static PricingCalculationResult calculateWall({
    required double lengthFt,
    required double heightFt,
    required double thicknessInches,
    required double unitPrice,
  }) {
    final area = lengthFt * heightFt;
    final bricks = (area * 8.6 * (thicknessInches / 4.5)).ceil();
    final trolleys = double.parse((bricks / 4000.0).toStringAsFixed(1));
    final cost = (bricks * unitPrice).ceilToDouble();
    final cement = (bricks * 0.007).ceil();
    final sand = (bricks * 0.35).ceil();

    return PricingCalculationResult(
      bricksNeeded: bricks,
      trolleysCount: trolleys,
      cementBags: cement,
      sandCuFt: sand,
      totalEstimatedCost: cost,
    );
  }

  /// 3-in-1 House estimation formula
  static PricingCalculationResult calculateHouse({
    required double sqft,
    required int floors,
    required double unitPrice,
  }) {
    final bricks = (sqft * floors * 19).ceil();
    final trolleys = double.parse((bricks / 4000.0).toStringAsFixed(1));
    final cost = (bricks * unitPrice).ceilToDouble();
    final cement = (sqft * floors * 0.4).ceil();
    final sand = (sqft * floors * 1.8).ceil();

    return PricingCalculationResult(
      bricksNeeded: bricks,
      trolleysCount: trolleys,
      cementBags: cement,
      sandCuFt: sand,
      totalEstimatedCost: cost,
    );
  }

  /// 3-in-1 Boundary wall estimation formula
  static PricingCalculationResult calculateBoundary({
    required double lengthFt,
    required double heightFt,
    required double unitPrice,
  }) {
    final bricks = (lengthFt * heightFt * 9.5).ceil();
    final trolleys = double.parse((bricks / 4000.0).toStringAsFixed(1));
    final cost = (bricks * unitPrice).ceilToDouble();
    final cement = (bricks * 0.006).ceil();
    final sand = (bricks * 0.3).ceil();

    return PricingCalculationResult(
      bricksNeeded: bricks,
      trolleysCount: trolleys,
      cementBags: cement,
      sandCuFt: sand,
      totalEstimatedCost: cost,
    );
  }
}
