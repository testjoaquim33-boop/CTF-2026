package com.vacationbudget.ui

import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.vacationbudget.databinding.ActivityBudgetSetupBinding
import com.vacationbudget.models.BudgetConfig
import com.vacationbudget.viewmodel.BudgetViewModel

class BudgetSetupActivity : AppCompatActivity() {

    private lateinit var b: ActivityBudgetSetupBinding
    private val vm: BudgetViewModel by viewModels()
    private var currentConfig = BudgetConfig()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b = ActivityBudgetSetupBinding.inflate(layoutInflater)
        setContentView(b.root)
        setSupportActionBar(b.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        title = "Paramètres du budget"

        vm.uiState.observe(this) { state ->
            currentConfig = state.config
            b.etTripName.setText(state.config.name)
            b.etTotalBudget.setText(state.config.totalAmount.toString())
            b.etStartDate.setText(state.config.startDate)
            b.etEndDate.setText(state.config.endDate)
            b.spinnerCurrency.setText(state.config.currency, false)
        }

        val currencies = listOf("EUR (€)", "USD ($)", "GBP (£)", "CHF", "JPY (¥)")
        val adapter = android.widget.ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, currencies)
        (b.spinnerCurrency as? android.widget.AutoCompleteTextView)?.setAdapter(adapter)

        b.btnSave.setOnClickListener {
            val name = b.etTripName.text?.toString()?.trim() ?: "Mes vacances"
            val total = b.etTotalBudget.text?.toString()?.toDoubleOrNull()
            if (total == null || total <= 0) { b.tilTotalBudget.error = "Montant invalide"; return@setOnClickListener }
            b.tilTotalBudget.error = null
            val newConfig = currentConfig.copy(
                name = name,
                totalAmount = total,
                startDate = b.etStartDate.text?.toString()?.trim() ?: "",
                endDate = b.etEndDate.text?.toString()?.trim() ?: "",
            )
            vm.updateConfig(newConfig)
            finish()
        }
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
