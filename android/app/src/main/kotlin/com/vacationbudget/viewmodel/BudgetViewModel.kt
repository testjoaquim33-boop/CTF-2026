package com.vacationbudget.viewmodel

import android.app.Application
import androidx.lifecycle.*
import com.vacationbudget.database.BudgetDatabase
import com.vacationbudget.models.BudgetConfig
import com.vacationbudget.models.Category
import com.vacationbudget.models.Expense
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.util.UUID
import kotlin.math.max
import kotlin.math.min
import kotlin.math.round

data class CategoryStat(
    val category: Category,
    val spent: Double,
    val remaining: Double,
    val percentage: Float,     // 0-100
)

data class BudgetUiState(
    val config: BudgetConfig = BudgetConfig(),
    val categories: List<Category> = emptyList(),
    val expenses: List<Expense> = emptyList(),
    val categoryStats: List<CategoryStat> = emptyList(),
    val totalSpent: Double = 0.0,
    val totalRemaining: Double = 0.0,
)

class BudgetViewModel(app: Application) : AndroidViewModel(app) {

    private val dao = BudgetDatabase.getInstance(app).budgetDao()

    val uiState: LiveData<BudgetUiState> = combine(
        dao.observeConfig(),
        dao.observeCategories(),
        dao.observeExpenses(),
    ) { config, categories, expenses ->
        val cfg = config ?: BudgetConfig()
        val stats = categories.map { cat ->
            val spent = expenses.filter { it.categoryId == cat.id }.sumOf { it.amount }
            val remaining = max(0.0, cat.budgetAmount - spent)
            val pct = if (cat.budgetAmount > 0) min(100f, (spent / cat.budgetAmount * 100).toFloat()) else 0f
            CategoryStat(cat, spent, remaining, pct)
        }
        val totalSpent = expenses.sumOf { it.amount }
        BudgetUiState(cfg, categories, expenses, stats, totalSpent, cfg.totalAmount - totalSpent)
    }.asLiveData()

    // ── Config ────────────────────────────────────────────────────────────────

    fun updateConfig(config: BudgetConfig) = viewModelScope.launch {
        dao.upsertConfig(config)
    }

    /** Change le budget total et met à l'échelle toutes les catégories. */
    fun setTotalBudget(newTotal: Double, currentCategories: List<Category>, currentTotal: Double) {
        viewModelScope.launch {
            if (currentTotal <= 0.0) {
                dao.upsertConfig(
                    (dao.observeConfig() as? BudgetConfig ?: BudgetConfig()).copy(totalAmount = newTotal)
                )
                return@launch
            }
            val factor = newTotal / currentTotal
            val scaled = currentCategories.map { it.copy(budgetAmount = round2(it.budgetAmount * factor)) }
            dao.replaceAllCategories(scaled)
        }
    }

    // ── Categories ────────────────────────────────────────────────────────────

    fun addCategory(name: String, icon: String, amount: Double, currentCategories: List<Category>, totalBudget: Double) {
        viewModelScope.launch {
            val colorIndex = currentCategories.size % COLORS.size
            val newCat = Category(
                id = UUID.randomUUID().toString(),
                name = name,
                icon = icon,
                budgetAmount = min(amount, totalBudget),
                color = COLORS[colorIndex],
                sortOrder = currentCategories.size,
            )
            // Prélever sur les autres proportionnellement
            val currentTotal = currentCategories.sumOf { it.budgetAmount }
            val factor = max(0.0, currentTotal - amount) / max(currentTotal, 1.0)
            val updated = currentCategories.map { it.copy(budgetAmount = round2(it.budgetAmount * factor)) }
            dao.replaceAllCategories(updated + newCat)
        }
    }

    fun updateCategoryBudget(categoryId: String, newAmount: Double, allCategories: List<Category>) {
        viewModelScope.launch {
            val total = allCategories.sumOf { it.budgetAmount }
            val clamped = max(0.0, min(newAmount, total))

            val others = allCategories.filter { it.id != categoryId }
            val othersTotal = others.sumOf { it.budgetAmount }
            val remaining = total - clamped

            val updated = allCategories.map { cat ->
                when {
                    cat.id == categoryId -> cat.copy(budgetAmount = round2(clamped))
                    othersTotal == 0.0   -> cat.copy(budgetAmount = round2(remaining / others.size))
                    else                 -> cat.copy(budgetAmount = round2(remaining * cat.budgetAmount / othersTotal))
                }
            }
            dao.replaceAllCategories(updated)
        }
    }

    fun updateCategoryName(category: Category, newName: String) = viewModelScope.launch {
        dao.updateCategory(category.copy(name = newName))
    }

    fun deleteCategory(category: Category, allCategories: List<Category>) {
        viewModelScope.launch {
            val others = allCategories.filter { it.id != category.id }
            val othersTotal = others.sumOf { it.budgetAmount }
            val extra = category.budgetAmount
            val updated = if (othersTotal == 0.0) {
                others.map { it.copy(budgetAmount = round2(extra / others.size)) }
            } else {
                others.map { it.copy(budgetAmount = round2(it.budgetAmount + extra * it.budgetAmount / othersTotal)) }
            }
            dao.deleteCategory(category)
            updated.forEach { dao.updateCategory(it) }
        }
    }

    // ── Expenses ──────────────────────────────────────────────────────────────

    fun addExpense(categoryId: String, description: String, amount: Double, date: String) {
        viewModelScope.launch {
            dao.insertExpense(
                Expense(
                    id = UUID.randomUUID().toString(),
                    categoryId = categoryId,
                    description = description,
                    amount = amount,
                    date = date,
                )
            )
        }
    }

    fun deleteExpense(expense: Expense) = viewModelScope.launch {
        dao.deleteExpense(expense)
    }

    // ── Seed data (first launch) ──────────────────────────────────────────────

    fun seedIfEmpty(currentCategories: List<Category>) {
        if (currentCategories.isNotEmpty()) return
        viewModelScope.launch {
            dao.upsertConfig(BudgetConfig())
            val defaults = listOf(
                Category("c1", "Logement",   "🏨", 900.0,  "#3b82f6", 0),
                Category("c2", "Transport",  "✈️", 600.0,  "#10b981", 1),
                Category("c3", "Nourriture", "🍽️", 750.0,  "#f59e0b", 2),
                Category("c4", "Loisirs",    "🎭", 450.0,  "#ef4444", 3),
                Category("c5", "Shopping",   "🛍️", 300.0,  "#8b5cf6", 4),
            )
            defaults.forEach { dao.upsertCategory(it) }
        }
    }

    companion object {
        private val COLORS = listOf(
            "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
            "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
        )

        private fun round2(v: Double) = (v * 100).toLong().toDouble() / 100
    }
}
