package com.vacationbudget

import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.vacationbudget.databinding.ActivityMainBinding
import com.vacationbudget.viewmodel.BudgetViewModel

class MainActivity : AppCompatActivity() {

    private lateinit var b: ActivityMainBinding
    private val vm: BudgetViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b = ActivityMainBinding.inflate(layoutInflater)
        setContentView(b.root)

        val navHost = supportFragmentManager.findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHost.navController
        b.bottomNav.setupWithNavController(navController)

        // Seed default data on first launch
        vm.uiState.observe(this) { state ->
            vm.seedIfEmpty(state.categories)
        }
    }
}
