package com.vacationbudget.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "categories")
data class Category(
    @PrimaryKey val id: String,
    val name: String,
    val icon: String,
    val budgetAmount: Double,
    val color: String,          // hex string e.g. "#3b82f6"
    val sortOrder: Int = 0,
)
