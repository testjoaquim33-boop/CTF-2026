package com.vacationbudget.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.vacationbudget.databinding.ItemCategoryBinding
import com.vacationbudget.viewmodel.CategoryStat
import java.util.Locale

class CategoryAdapter(
    private val currencySymbol: String,
    private val onEdit: (CategoryStat) -> Unit,
    private val onDelete: (CategoryStat) -> Unit,
    private val onAddExpense: (CategoryStat) -> Unit,
) : ListAdapter<CategoryStat, CategoryAdapter.VH>(Diff()) {

    inner class VH(private val b: ItemCategoryBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(stat: CategoryStat) {
            val cat = stat.category
            b.tvIcon.text = cat.icon
            b.tvName.text = cat.name
            b.tvBudget.text = "${currencySymbol}${String.format(Locale.getDefault(), "%.2f", cat.budgetAmount)}"
            b.tvSpent.text = "Dépensé : ${currencySymbol}${String.format(Locale.getDefault(), "%.2f", stat.spent)}"
            b.tvRemaining.text = if (stat.remaining > 0)
                "Restant : ${currencySymbol}${String.format(Locale.getDefault(), "%.2f", stat.remaining)}"
            else
                "Dépassement de ${currencySymbol}${String.format(Locale.getDefault(), "%.2f", -stat.remaining)}"

            b.progressBar.progress = stat.percentage.toInt()
            b.tvPercent.text = "${stat.percentage.toInt()}%"

            // Color accent
            try {
                val color = Color.parseColor(cat.color)
                b.viewAccent.setBackgroundColor(color)
                b.progressBar.setIndicatorColor(color)
            } catch (_: Exception) {}

            b.btnEdit.setOnClickListener { onEdit(stat) }
            b.btnDelete.setOnClickListener { onDelete(stat) }
            b.btnAddExpense.setOnClickListener { onAddExpense(stat) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemCategoryBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(getItem(position))

    class Diff : DiffUtil.ItemCallback<CategoryStat>() {
        override fun areItemsTheSame(a: CategoryStat, b: CategoryStat) = a.category.id == b.category.id
        override fun areContentsTheSame(a: CategoryStat, b: CategoryStat) = a == b
    }
}
