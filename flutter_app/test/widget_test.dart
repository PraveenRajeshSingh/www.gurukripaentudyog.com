// Smoke tests for the estimation and GST engine that backs the Estimator tab.

import 'package:flutter_test/flutter_test.dart';

import 'package:brick_supply_saas/services/estimator_engine.dart';

void main() {
  test('wall estimation returns bricks, trolleys and cost', () {
    final result = EstimatorEngine.calculateWall(
      lengthFt: 20,
      heightFt: 10,
      thicknessInches: 9,
      unitPrice: 7.05,
    );

    expect(result.bricksNeeded, greaterThan(0));
    expect(result.trolleysCount, greaterThan(0));
    expect(result.totalEstimatedCost, result.bricksNeeded * 7.05);
  });

  test('reverse GST splits a 5% inclusive total into CGST and SGST', () {
    final gst = EstimatorEngine.calculateReverseGst(28200);

    expect(gst.taxableValue, 26857);
    expect(gst.cgst + gst.sgst, closeTo(gst.totalTax, 1));
    expect(gst.grandTotal, 28200);
  });
}
