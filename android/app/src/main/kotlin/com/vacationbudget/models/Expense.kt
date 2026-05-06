package com.vacationbudget.models

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "expenses",
    foreignKeys = [
        ForeignKey(
            entity = Category::class,
            parentColumns = ["id"],
            childColumns = ["categoryId"],
            onDelete = ForeignKey.CASCADE,
        )
    ],
    indices = [Index("categoryId")],
)
data class Expense(
    @PrimaryKey val id: String,
    val categoryId: String,
    val description: String,
    val amount: Double,
    val date: String,           // ISO date yyyy-MM-dd
)
