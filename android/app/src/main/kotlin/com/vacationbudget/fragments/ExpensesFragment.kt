package com.vacationbudget.fragments

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.vacationbudget.adapters.ExpenseAdapter
import com.vacationbudget.databinding.FragmentExpensesBinding
import com.vacationbudget.models.Expense
import com.vacationbudget.ui.AddExpenseActivity
import com.vacationbudget.viewmodel.BudgetViewModel

class ExpensesFragment : Fragment() {

    private var _b: FragmentExpensesBinding? = null
    private val b get() = _b!!
    private val vm: BudgetViewModel by activityViewModels()
    private lateinit var adapter: ExpenseAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, s: Bundle?): View {
        _b = FragmentExpensesBinding.inflate(inflater, container, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = ExpenseAdapter(
            currencySymbol = "€",
            categoryMap = { vm.uiState.value?.categories?.associateBy { it.id } ?: emptyMap() },
            onDelete = ::confirmDelete,
        )
        b.rvExpenses.layoutManager = LinearLayoutManager(requireContext())
        b.rvExpenses.adapter = adapter

        b.fabAddExpense.setOnClickListener {
            startActivity(Intent(requireContext(), AddExpenseActivity::class.java))
        }

        vm.uiState.observe(viewLifecycleOwner) { state ->
            adapter.submitList(state.expenses)
            b.tvEmpty.visibility = if (state.expenses.isEmpty()) View.VISIBLE else View.GONE
            b.tvTotalSpent.text = "Total dépensé : ${state.config.currencySymbol}${
                String.format(java.util.Locale.getDefault(), "%.2f", state.totalSpent)
            }"
        }
    }

    private fun confirmDelete(expense: Expense) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Supprimer cette dépense ?")
            .setMessage("\"${expense.description}\" — ${expense.amount}")
            .setPositiveButton("Supprimer") { _, _ -> vm.deleteExpense(expense) }
            .setNegativeButton("Annuler", null)
            .show()
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
