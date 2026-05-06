package com.vacationbudget.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.vacationbudget.R
import com.vacationbudget.adapters.CategoryAdapter
import com.vacationbudget.databinding.FragmentCategoriesBinding
import com.vacationbudget.viewmodel.BudgetViewModel
import com.vacationbudget.viewmodel.CategoryStat

class CategoriesFragment : Fragment() {

    private var _b: FragmentCategoriesBinding? = null
    private val b get() = _b!!
    private val vm: BudgetViewModel by activityViewModels()
    private lateinit var adapter: CategoryAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, s: Bundle?): View {
        _b = FragmentCategoriesBinding.inflate(inflater, container, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = CategoryAdapter(
            currencySymbol = "€",
            onEdit = ::showEditDialog,
            onDelete = { stat ->
                MaterialAlertDialogBuilder(requireContext())
                    .setTitle("Supprimer ${stat.category.name} ?")
                    .setMessage("Le budget sera redistribué entre les autres catégories.")
                    .setPositiveButton("Supprimer") { _, _ ->
                        vm.deleteCategory(stat.category, vm.uiState.value?.categories ?: emptyList())
                    }
                    .setNegativeButton("Annuler", null)
                    .show()
            },
            onAddExpense = { stat ->
                val intent = android.content.Intent(requireContext(), com.vacationbudget.ui.AddExpenseActivity::class.java)
                intent.putExtra("default_category_id", stat.category.id)
                startActivity(intent)
            },
        )

        b.rvCategories.layoutManager = LinearLayoutManager(requireContext())
        b.rvCategories.adapter = adapter

        b.fabAddCategory.setOnClickListener { showAddDialog() }

        vm.uiState.observe(viewLifecycleOwner) { state ->
            adapter.submitList(state.categoryStats)
            val sym = state.config.currencySymbol
            adapter = CategoryAdapter(
                currencySymbol = sym,
                onEdit = ::showEditDialog,
                onDelete = { stat ->
                    MaterialAlertDialogBuilder(requireContext())
                        .setTitle("Supprimer ${stat.category.name} ?")
                        .setMessage("Le budget sera redistribué entre les autres catégories.")
                        .setPositiveButton("Supprimer") { _, _ ->
                            vm.deleteCategory(stat.category, state.categories)
                        }
                        .setNegativeButton("Annuler", null)
                        .show()
                },
                onAddExpense = { stat ->
                    val intent = android.content.Intent(requireContext(), com.vacationbudget.ui.AddExpenseActivity::class.java)
                    intent.putExtra("default_category_id", stat.category.id)
                    startActivity(intent)
                },
            )
            b.rvCategories.adapter = adapter
            adapter.submitList(state.categoryStats)
            b.tvTotalAllocated.text = "Alloué : ${sym}${
                String.format(java.util.Locale.getDefault(), "%.2f", state.categories.sumOf { it.budgetAmount })
            } / ${sym}${String.format(java.util.Locale.getDefault(), "%.2f", state.config.totalAmount)}"
        }
    }

    private fun showAddDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_category_form, null)
        val etName   = dialogView.findViewById<TextInputEditText>(R.id.etName)
        val etAmount = dialogView.findViewById<TextInputEditText>(R.id.etAmount)
        val etIcon   = dialogView.findViewById<TextInputEditText>(R.id.etIcon)

        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Nouvelle catégorie")
            .setView(dialogView)
            .setPositiveButton("Ajouter") { _, _ ->
                val name = etName.text?.toString()?.trim() ?: return@setPositiveButton
                val amount = etAmount.text?.toString()?.toDoubleOrNull() ?: return@setPositiveButton
                val icon = etIcon.text?.toString()?.trim()?.ifEmpty { "📦" } ?: "📦"
                val state = vm.uiState.value ?: return@setPositiveButton
                vm.addCategory(name, icon, amount, state.categories, state.config.totalAmount)
            }
            .setNegativeButton("Annuler", null)
            .show()
    }

    private fun showEditDialog(stat: CategoryStat) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_category_form, null)
        val etName   = dialogView.findViewById<TextInputEditText>(R.id.etName)
        val etAmount = dialogView.findViewById<TextInputEditText>(R.id.etAmount)
        val etIcon   = dialogView.findViewById<TextInputEditText>(R.id.etIcon)
        etName.setText(stat.category.name)
        etAmount.setText(stat.category.budgetAmount.toString())
        etIcon.setText(stat.category.icon)

        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Modifier ${stat.category.name}")
            .setView(dialogView)
            .setPositiveButton("Enregistrer") { _, _ ->
                val name = etName.text?.toString()?.trim()
                val amount = etAmount.text?.toString()?.toDoubleOrNull()
                val icon = etIcon.text?.toString()?.trim()
                if (!name.isNullOrEmpty()) vm.updateCategoryName(stat.category, name)
                if (icon != null && icon != stat.category.icon) vm.updateCategoryName(stat.category.copy(icon = icon), icon)
                if (amount != null) {
                    val cats = vm.uiState.value?.categories ?: emptyList()
                    vm.updateCategoryBudget(stat.category.id, amount, cats)
                }
            }
            .setNegativeButton("Annuler", null)
            .show()
    }

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
