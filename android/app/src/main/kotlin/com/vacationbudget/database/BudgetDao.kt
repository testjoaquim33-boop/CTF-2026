package com.vacationbudget.database

import androidx.room.*
import com.vacationbudget.models.BudgetConfig
import com.vacationbudget.models.Category
import com.vacationbudget.models.Expense
import kotlinx.coroutines.flow.Flow

@Dao
interface BudgetDao {

    // ── BudgetConfig ──────────────────────────────────────────────────────────

    @Query("SELECT * FROM budget_config WHERE id = 1")
    fun observeConfig(): Flow<BudgetConfig?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertConfig(config: BudgetConfig)

    // ── Categories ────────────────────────────────────────────────────────────

    @Query("SELECT * FROM categories ORDER BY sortOrder ASC, name ASC")
    fun observeCategories(): Flow<List<Category>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertCategory(category: Category)

    @Update
    suspend fun updateCategory(category: Category)

    @Delete
    suspend fun deleteCategory(category: Category)

    @Query("DELETE FROM categories")
    suspend fun deleteAllCategories()

    @Transaction
    suspend fun replaceAllCategories(categories: List<Category>) {
        deleteAllCategories()
        categories.forEach { upsertCategory(it) }
    }

    // ── Expenses ──────────────────────────────────────────────────────────────

    @Query("SELECT * FROM expenses ORDER BY date DESC")
    fun observeExpenses(): Flow<List<Expense>>

    @Query("SELECT * FROM expenses WHERE categoryId = :catId ORDER BY date DESC")
    fun observeExpensesForCategory(catId: String): Flow<List<Expense>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: Expense)

    @Delete
    suspend fun deleteExpense(expense: Expense)

    @Query("SELECT SUM(amount) FROM expenses WHERE categoryId = :catId")
    suspend fun totalSpentForCategory(catId: String): Double?

    @Query("SELECT SUM(amount) FROM expenses")
    suspend fun totalSpent(): Double?
}
