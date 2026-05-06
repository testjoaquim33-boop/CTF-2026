package com.vacationbudget.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.vacationbudget.databinding.ItemExpenseBinding
import com.vacationbudget.models.Category
import com.vacationbudget.models.Expense
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

class ExpenseAdapter(
    private val currencySymbol: String,
    private val categoryMap: () -> Map<String, Category>,
    private val onDelete: (Expense) -> Unit,
) : ListAdapter<Expense, ExpenseAdapter.VH>(Diff()) {

    inner class VH(private val b: ItemExpenseBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(exp: Expense) {
            val cat = categoryMap()[exp.categoryId]
            b.tvDescription.text = exp.description
            b.tvCategory.text = "${cat?.icon ?: "💼"} ${cat?.name ?: "Inconnu"}"
            b.tvAmount.text = "${currencySymbol}${String.format(Locale.getDefault(), "%.2f", exp.amount)}"

            // Format date
            val date = try {
                LocalDate.parse(exp.date).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            } catch (_: Exception) { exp.date }
            b.tvDate.text = date

            b.btnDelete.setOnClickListener { onDelete(exp) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH =
        VH(ItemExpenseBinding.inflate(LayoutInflater.from(parent.context), parent, false))

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(getItem(position))

    class Diff : DiffUtil.ItemCallback<Expense>() {
        override fun areItemsTheSame(a: Expense, b: Expense) = a.id == b.id
        override fun areContentsTheSame(a: Expense, b: Expense) = a == b
    }
}
