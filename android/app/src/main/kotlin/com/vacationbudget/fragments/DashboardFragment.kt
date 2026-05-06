package com.vacationbudget.fragments

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.github.mikephil.charting.data.PieData
import com.github.mikephil.charting.data.PieDataSet
import com.github.mikephil.charting.data.PieEntry
import com.github.mikephil.charting.formatter.PercentFormatter
import com.vacationbudget.databinding.FragmentDashboardBinding
import com.vacationbudget.viewmodel.BudgetViewModel
import java.util.Locale

class DashboardFragment : Fragment() {

    private var _b: FragmentDashboardBinding? = null
    private val b get() = _b!!
    private val vm: BudgetViewModel by activityViewModels()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, s: Bundle?): View {
        _b = FragmentDashboardBinding.inflate(inflater, container, false)
        return b.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupPieChart()

        vm.uiState.observe(viewLifecycleOwner) { state ->
            val sym = state.config.currencySymbol
            val total = state.config.totalAmount
            val spent = state.totalSpent
            val remaining = total - spent
            val pct = if (total > 0) (spent / total * 100).toInt() else 0

            b.tvTripName.text = state.config.name
            b.tvTotalBudget.text = "${sym}${fmt(total)}"
            b.tvSpent.text = "${sym}${fmt(spent)}"
            b.tvRemaining.text = "${if (remaining < 0) "-" else ""}${sym}${fmt(Math.abs(remaining))}"
            b.tvRemainingLabel.text = if (remaining < 0) "Dépassement" else "Restant"
            b.progressGlobal.progress = pct.coerceIn(0, 100)
            b.tvGlobalPct.text = "$pct%"

            // Update pie chart
            if (state.categories.isNotEmpty()) {
                val entries = state.categoryStats.map { PieEntry(it.category.budgetAmount.toFloat(), it.category.name) }
                val colors = state.categoryStats.map {
                    try { Color.parseColor(it.category.color) } catch (_: Exception) { Color.GRAY }
                }
                val dataSet = PieDataSet(entries, "").apply {
                    this.colors = colors
                    valueTextColor = Color.WHITE
                    valueTextSize = 11f
                    sliceSpace = 2f
                }
                val pieData = PieData(dataSet).apply {
                    setValueFormatter(PercentFormatter(b.pieChart))
                }
                b.pieChart.data = pieData
                b.pieChart.centerText = "${sym}${fmt(remaining)}\nrestant"
                b.pieChart.invalidate()
                b.pieChart.visibility = View.VISIBLE
            } else {
                b.pieChart.visibility = View.GONE
            }
        }
    }

    private fun setupPieChart() {
        b.pieChart.apply {
            description.isEnabled = false
            isDrawHoleEnabled = true
            holeRadius = 52f
            transparentCircleRadius = 57f
            setHoleColor(Color.TRANSPARENT)
            setUsePercentValues(true)
            legend.isEnabled = false
            setEntryLabelColor(Color.WHITE)
            setEntryLabelTextSize(11f)
            setCenterTextSize(13f)
        }
    }

    private fun fmt(v: Double) = String.format(Locale.getDefault(), "%.2f", v)

    override fun onDestroyView() { super.onDestroyView(); _b = null }
}
