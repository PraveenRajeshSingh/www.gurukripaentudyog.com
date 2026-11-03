package com.gurukripa.entudyog

import com.gurukripa.entudyog.core.util.EstimatorEngine
import org.junit.Assert.assertEquals
import org.junit.Test

class EstimatorEngineTest {

    @Test
    fun testWallEstimatorMatchesProductionFormula() {
        // 20ft length, 10ft height, 9in thick, ₹12/brick
        val result = EstimatorEngine.calculateWall(
            lengthFt = 20.0,
            heightFt = 10.0,
            thicknessInches = 9.0,
            brickPrice = 12.0
        )

        // Area = 200 sqft; Bricks = ceil(200 * 8.6 * 2) = 3440
        assertEquals(3440, result.bricks)
        assertEquals(0.9, result.trolleys, 0.01)
        assertEquals(25, result.cementBags) // ceil(3440 * 0.007)
        assertEquals(1204, result.sandCuFt) // ceil(3440 * 0.35)
        assertEquals(41280, result.estimatedCost) // 3440 * 12
    }

    @Test
    fun testHouseEstimatorMatchesProductionFormula() {
        // 1000 sqft, 2 floors, ₹7.05/brick
        val result = EstimatorEngine.calculateHouse(
            builtupSqFt = 1000.0,
            floors = 2,
            brickPrice = 7.05
        )

        // Bricks = 1000 * 2 * 18.5 = 37000
        assertEquals(37000, result.bricks)
        assertEquals(9.3, result.trolleys, 0.01)
        assertEquals(296, result.cementBags) // ceil(37000 * 0.008)
        assertEquals(14800, result.sandCuFt) // ceil(37000 * 0.4)
        assertEquals(260850, result.estimatedCost) // ceil(37000 * 7.05)
    }

    @Test
    fun testBoundaryEstimatorMatchesProductionFormula() {
        // 150ft perimeter, 6ft height, 4.5in thick, ₹6.25/brick
        val result = EstimatorEngine.calculateBoundary(
            perimeterFt = 150.0,
            heightFt = 6.0,
            thicknessInches = 4.5,
            brickPrice = 6.25
        )

        // Area = 900; Bricks = ceil(900 * 8.6 * 1) = 7740
        assertEquals(7740, result.bricks)
        assertEquals(1.9, result.trolleys, 0.01)
        assertEquals(47, result.cementBags) // ceil(7740 * 0.006)
        assertEquals(2322, result.sandCuFt) // ceil(7740 * 0.3)
        assertEquals(48375, result.estimatedCost) // ceil(7740 * 6.25)
    }
}
