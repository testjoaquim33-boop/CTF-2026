package com.vacationbudget.ui

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.vacationbudget.databinding.ActivityAddExpenseBinding
import com.vacationbudget.models.Category
import com.vacationbudget.viewmodel.BudgetViewModel
import java.time.LocalDate
import java.util.Locale

class AddExpenseActivity : AppCompatActivity() {

    private lateinit var b: ActivityAddExpenseBinding
    private val vm: BudgetViewModel by viewModels()
    private var categories = listOf<Category>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b = ActivityAddExpenseBinding.inflate(layoutInflater)
        setContentView(b.root)
        setSupportActionBar(b.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val defaultCategoryId = intent.getStringExtra("default_category_id")

        // Set today's date
        b.etDate.setText(LocalDate.now().toString())

        vm.uiState.observe(this) { state ->
            categories = state.categories
            val sym = state.config.currencySymbol

            val names = categories.map { "${it.icon} ${it.name}" }
            val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, names)
            (b.spinnerCategory as? AutoCompleteTextView)?.setAdapter(adapter)

            // Pre-select default category
            val idx = defaultCategoryId?.let { id -> categories.indexOfFirst { it.id == id } } ?: 0
            if (idx >= 0 && names.isNotEmpty()) {
                (b.spinnerCategory as? AutoCompleteTextView)?.setText(names[idx], false)
            }
        }

        b.btnSave.setOnClickListener { saveExpense() }
        b.btnCancel.setOnClickListener { finish() }
    }

    private fun saveExpense() {
        val description = b.etDescription.text?.toString()?.trim() ?: ""
        val amountStr   = b.etAmount.text?.toString()?.trim() ?: ""
        val date        = b.etDate.text?.toString()?.trim() ?: LocalDate.now().toString()
        val catText     = (b.spinnerCategory as? AutoCompleteTextView)?.text?.toString() ?: ""

        val amount = amountStr.toDoubleOrNull()
        if (amount == null || amount <= 0) {
            b.tilAmount.error = "Montant invalide"
            return
        }
        b.tilAmount.error = null

        // Match category by display name
        val cat = categories.firstOrNull { "${it.icon} ${it.name}" == catText }
            ?: categories.firstOrNull()
            ?: return

        vm.addExpense(cat.id, description.ifEmpty { "Dépense" }, amount, date)
        finish()
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
