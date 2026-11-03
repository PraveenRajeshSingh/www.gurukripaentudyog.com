package com.gurukripa.entudyog.core.util

import kotlin.math.ceil

data class EstimatorResult(
    val bricks: Int,
    val trolleys: Double,
    val cementBags: Int,
    val sandCuFt: Int,
    val estimatedCost: Int
)

object EstimatorEngine {

    /**
     * Standard Wall Estimation Formula:
     * Area = len * ht
     * Bricks = ceil(Area * 8.6 * (thickness / 4.5))
     * Trolleys = (Bricks / 4000) rounded to 1 decimal
     * Cement bags = ceil(Bricks * 0.007)
     * Sand volume = ceil(Bricks * 0.35)
     */
    fun calculateWall(
        lengthFt: Double,
        heightFt: Double,
        thicknessInches: Double = 9.0,
        brickPrice: Double = 12.0
    ): EstimatorResult {
        val area = lengthFt * heightFt
        val bricks = ceil(area * 8.6 * (thicknessInches / 4.5)).toInt()
        val trolleys = String.format("%.1f", bricks / 4000.0).toDouble()
        val cementBags = ceil(bricks * 0.007).toInt()
        val sandCuFt = ceil(bricks * 0.35).toInt()
        val estimatedCost = ceil(bricks * brickPrice).toInt()

        return EstimatorResult(
            bricks = bricks,
            trolleys = trolleys,
            cementBags = cementBags,
            sandCuFt = sandCuFt,
            estimatedCost = estimatedCost
        )
    }

    /**
     * House Estimation Formula:
     * Bricks = ceil(sqft * floors * 18.5)
     * Cement bags = ceil(Bricks * 0.008)
     * Sand volume = ceil(Bricks * 0.4)
     */
    fun calculateHouse(
        builtupSqFt: Double,
        floors: Int = 1,
        brickPrice: Double = 7.05
    ): EstimatorResult {
        val bricks = ceil(builtupSqFt * floors * 18.5).toInt()
        val trolleys = String.format("%.1f", bricks / 4000.0).toDouble()
        val cementBags = ceil(bricks * 0.008).toInt()
        val sandCuFt = ceil(bricks * 0.4).toInt()
        val estimatedCost = ceil(bricks * brickPrice).toInt()

        return EstimatorResult(
            bricks = bricks,
            trolleys = trolleys,
            cementBags = cementBags,
            sandCuFt = sandCuFt,
            estimatedCost = estimatedCost
        )
    }

    /**
     * Boundary Wall Estimation Formula:
     * Area = perim * ht
     * Bricks = ceil(Area * 8.6 * (thickness / 4.5))
     * Cement bags = ceil(Bricks * 0.006)
     * Sand volume = ceil(Bricks * 0.3)
     */
    fun calculateBoundary(
        perimeterFt: Double,
        heightFt: Double = 6.0,
        thicknessInches: Double = 4.5,
        brickPrice: Double = 6.25
    ): EstimatorResult {
        val area = perimeterFt * heightFt
        val bricks = ceil(area * 8.6 * (thicknessInches / 4.5)).toInt()
        val trolleys = String.format("%.1f", bricks / 4000.0).toDouble()
        val cementBags = ceil(bricks * 0.006).toInt()
        val sandCuFt = ceil(bricks * 0.3).toInt()
        val estimatedCost = ceil(bricks * brickPrice).toInt()

        return EstimatorResult(
            bricks = bricks,
            trolleys = trolleys,
            cementBags = cementBags,
            sandCuFt = sandCuFt,
            estimatedCost = estimatedCost
        )
    }
}
