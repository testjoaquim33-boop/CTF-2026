package com.vacationbudget.models

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Singleton row (id is always 1) storing the global budget parameters. */
@Entity(tableName = "budget_config")
data class BudgetConfig(
    @PrimaryKey val id: Int = 1,
    val name: String = "Mes vacances",
    val totalAmount: Double = 3000.0,
    val currency: String = "EUR",
    val currencySymbol: String = "€",
    val startDate: String = "",
    val endDate: String = "",
)
