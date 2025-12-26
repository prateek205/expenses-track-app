// Expenses Tracker Application
class ExpensesTracker {
    constructor() {
        this.expenses = [];
        this.categories = [
            'Food & Dining', 'Transportation', 'Shopping', 'Housing', 
            'Utilities', 'Entertainment', 'Healthcare', 'Education', 
            'Personal Care', 'Other'
        ];
        this.months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        // Initialize charts
        this.categoryChart = null;
        this.monthlyChart = null;
        
        // Current editing expense id
        this.editingExpenseId = null;
        
        // Initialize the app
        this.init();
    }
    
    init() {
        // Load expenses from localStorage
        this.loadExpenses();
        
        // Set today's date as default in the form
        this.setDefaultDate();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Render initial data
        this.renderExpenses();
        this.updateStats();
        this.renderCharts();
        this.updateTrends();
    }
    
    // Load expenses from localStorage
    loadExpenses() {
        const savedExpenses = localStorage.getItem('expenses');
        if (savedExpenses) {
            this.expenses = JSON.parse(savedExpenses);
        }
        
        // Load budget from localStorage
        const savedBudget = localStorage.getItem('monthlyBudget');
        if (savedBudget) {
            this.monthlyBudget = parseFloat(savedBudget);
            this.updateBudgetStatus();
        }
    }
    
    // Save expenses to localStorage
    saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }
    
    // Set default date in form to today
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expense-date').value = today;
        document.getElementById('edit-expense-date').value = today;
    }
    
    // Initialize all event listeners
    initEventListeners() {
        // Add expense form
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });
        
        // Reset form button
        document.getElementById('reset-form-btn').addEventListener('click', () => {
            document.getElementById('expense-form').reset();
            this.setDefaultDate();
        });
        
        // Filter controls
        document.getElementById('filter-category').addEventListener('change', () => {
            this.renderExpenses();
        });
        
        document.getElementById('filter-month').addEventListener('change', () => {
            this.renderExpenses();
        });
        
        // Quick action buttons
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('clear-all').addEventListener('click', () => {
            this.showConfirmModal(
                'Clear All Expenses',
                'Are you sure you want to delete all expenses? This action cannot be undone.',
                () => this.clearAllExpenses()
            );
        });
        
        document.getElementById('add-sample').addEventListener('click', () => {
            this.addSampleData();
        });
        
        document.getElementById('set-budget').addEventListener('click', () => {
            this.showBudgetModal();
        });
        
        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // Confirmation modal buttons
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            this.closeAllModals();
        });
        
        document.getElementById('confirm-ok').addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
            }
            this.closeAllModals();
        });
        
        // Save edit button
        document.getElementById('save-edit-btn').addEventListener('click', () => {
            this.saveEditedExpense();
        });
        
        // Save budget button
        document.getElementById('save-budget-btn').addEventListener('click', () => {
            this.saveBudget();
        });
        
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
    }
    
    // Add a new expense
    addExpense() {
        const name = document.getElementById('expense-name').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const category = document.getElementById('expense-category').value;
        const date = document.getElementById('expense-date').value;
        const notes = document.getElementById('expense-notes').value.trim();
        
        // Validate inputs
        if (!name || !amount || !category || !date) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Create expense object
        const expense = {
            id: Date.now().toString(),
            name,
            amount,
            category,
            date,
            notes,
            createdAt: new Date().toISOString()
        };
        
        // Add to expenses array
        this.expenses.unshift(expense);
        
        // Save to localStorage
        this.saveExpenses();
        
        // Update UI
        this.renderExpenses();
        this.updateStats();
        this.renderCharts();
        this.updateTrends();
        
        // Reset form
        document.getElementById('expense-form').reset();
        this.setDefaultDate();
        
        // Show success message
        this.showToast('Expense added successfully!', 'success');
    }
    
    // Render expenses list
    renderExpenses() {
        const expensesList = document.getElementById('expenses-list');
        const filterCategory = document.getElementById('filter-category').value;
        const filterMonth = document.getElementById('filter-month').value;
        
        // Filter expenses
        let filteredExpenses = [...this.expenses];
        
        if (filterCategory !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => expense.category === filterCategory);
        }
        
        if (filterMonth !== 'all') {
            filteredExpenses = this.filterByMonth(filteredExpenses, filterMonth);
        }
        
        // Clear the list
        expensesList.innerHTML = '';
        
        // Show empty state if no expenses
        if (filteredExpenses.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-receipt"></i>
                <h3>No expenses found</h3>
                <p>Try changing your filters or add a new expense</p>
            `;
            expensesList.appendChild(emptyState);
            
            // Update summary
            document.getElementById('shown-total').textContent = '$0.00';
            document.getElementById('expense-count').textContent = '0';
            
            return;
        }
        
        // Add each expense to the list
        let totalShown = 0;
        
        filteredExpenses.forEach(expense => {
            totalShown += expense.amount;
            
            const expenseDate = new Date(expense.date);
            const formattedDate = expenseDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            const expenseItem = document.createElement('div');
            expenseItem.className = `expense-item category-${expense.category.toLowerCase().replace(' & ', '-').replace(' ', '-')}`;
            expenseItem.dataset.id = expense.id;
            
            expenseItem.innerHTML = `
                <div class="expense-info">
                    <div class="expense-header">
                        <div class="expense-name">${expense.name}</div>
                        <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                    </div>
                    <div class="expense-details">
                        <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                        <span class="expense-category">${expense.category}</span>
                    </div>
                    ${expense.notes ? `<div class="expense-notes">${expense.notes}</div>` : ''}
                </div>
                <div class="expense-actions">
                    <button class="edit-btn" data-id="${expense.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${expense.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            expensesList.appendChild(expenseItem);
        });
        
        // Add event listeners to edit and delete buttons
        expensesList.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const expenseId = e.currentTarget.dataset.id;
                this.editExpense(expenseId);
            });
        });
        
        expensesList.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const expenseId = e.currentTarget.dataset.id;
                this.showConfirmModal(
                    'Delete Expense',
                    'Are you sure you want to delete this expense?',
                    () => this.deleteExpense(expenseId)
                );
            });
        });
        
        // Update summary
        document.getElementById('shown-total').textContent = `$${totalShown.toFixed(2)}`;
        document.getElementById('expense-count').textContent = filteredExpenses.length;
    }
    
    // Filter expenses by month
    filterByMonth(expenses, monthFilter) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            const expenseMonth = expenseDate.getMonth();
            const expenseYear = expenseDate.getFullYear();
            
            switch (monthFilter) {
                case 'current':
                    return expenseMonth === currentMonth && expenseYear === currentYear;
                case 'last':
                    let lastMonth = currentMonth - 1;
                    let lastYear = currentYear;
                    if (lastMonth < 0) {
                        lastMonth = 11;
                        lastYear--;
                    }
                    return expenseMonth === lastMonth && expenseYear === lastYear;
                default:
                    // For specific months
                    const monthIndex = this.months.findIndex(m => m.toLowerCase() === monthFilter);
                    return expenseMonth === monthIndex;
            }
        });
    }
    
    // Edit expense
    editExpense(expenseId) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (!expense) return;
        
        this.editingExpenseId = expenseId;
        
        // Fill the edit form
        document.getElementById('edit-expense-id').value = expense.id;
        document.getElementById('edit-expense-name').value = expense.name;
        document.getElementById('edit-expense-amount').value = expense.amount;
        document.getElementById('edit-expense-category').value = expense.category;
        document.getElementById('edit-expense-date').value = expense.date;
        document.getElementById('edit-expense-notes').value = expense.notes || '';
        
        // Show the edit modal
        this.showModal('edit-modal');
    }
    
    // Save edited expense
    saveEditedExpense() {
        const id = document.getElementById('edit-expense-id').value;
        const name = document.getElementById('edit-expense-name').value.trim();
        const amount = parseFloat(document.getElementById('edit-expense-amount').value);
        const category = document.getElementById('edit-expense-category').value;
        const date = document.getElementById('edit-expense-date').value;
        const notes = document.getElementById('edit-expense-notes').value.trim();
        
        // Validate inputs
        if (!name || !amount || !category || !date) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Find and update expense
        const expenseIndex = this.expenses.findIndex(e => e.id === id);
        if (expenseIndex === -1) return;
        
        this.expenses[expenseIndex] = {
            ...this.expenses[expenseIndex],
            name,
            amount,
            category,
            date,
            notes
        };
        
        // Save to localStorage
        this.saveExpenses();
        
        // Update UI
        this.renderExpenses();
        this.updateStats();
        this.renderCharts();
        this.updateTrends();
        
        // Close modal
        this.closeAllModals();
        
        // Show success message
        this.showToast('Expense updated successfully!', 'success');
    }
    
    // Delete expense
    deleteExpense(expenseId) {
        this.expenses = this.expenses.filter(expense => expense.id !== expenseId);
        
        // Save to localStorage
        this.saveExpenses();
        
        // Update UI
        this.renderExpenses();
        this.updateStats();
        this.renderCharts();
        this.updateTrends();
        
        // Show success message
        this.showToast('Expense deleted successfully!', 'success');
    }
    
    // Update statistics
    updateStats() {
        const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Calculate this month's expenses
        const monthExpenses = this.expenses.reduce((sum, expense) => {
            const expenseDate = new Date(expense.date);
            if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
                return sum + expense.amount;
            }
            return sum;
        }, 0);
        
        // Calculate daily average (for current month)
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const currentDay = now.getDate();
        const dailyAverage = monthExpenses / currentDay;
        
        // Update DOM
        document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('month-expenses').textContent = `$${monthExpenses.toFixed(2)}`;
        document.getElementById('daily-average').textContent = `$${dailyAverage.toFixed(2)}`;
        
        // Update budget status if budget is set
        if (this.monthlyBudget) {
            this.updateBudgetStatus();
        }
    }
    
    // Update trends information
    updateTrends() {
        if (this.expenses.length === 0) {
            document.getElementById('highest-category').textContent = '--';
            document.getElementById('most-expensive').textContent = '--';
            document.getElementById('average-expense').textContent = '$0.00';
            document.getElementById('week-expenses').textContent = '$0.00';
            return;
        }
        
        // Find highest spending category
        const categoryTotals = {};
        this.expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        
        let highestCategory = '--';
        let highestAmount = 0;
        
        for (const [category, total] of Object.entries(categoryTotals)) {
            if (total > highestAmount) {
                highestAmount = total;
                highestCategory = category;
            }
        }
        
        // Find most expensive item
        const mostExpensive = this.expenses.reduce((max, expense) => 
            expense.amount > max.amount ? expense : max, this.expenses[0]);
        
        // Calculate average expense
        const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const averageExpense = totalExpenses / this.expenses.length;
        
        // Calculate this week's expenses
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekExpenses = this.expenses.reduce((sum, expense) => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= oneWeekAgo ? sum + expense.amount : sum;
        }, 0);
        
        // Update DOM
        document.getElementById('highest-category').textContent = highestCategory;
        document.getElementById('most-expensive').textContent = `${mostExpensive.name}: $${mostExpensive.amount.toFixed(2)}`;
        document.getElementById('average-expense').textContent = `$${averageExpense.toFixed(2)}`;
        document.getElementById('week-expenses').textContent = `$${weekExpenses.toFixed(2)}`;
    }
    
    // Render charts
    renderCharts() {
        this.renderCategoryChart();
        this.renderMonthlyChart();
    }
    
    // Render category chart (pie chart)
    renderCategoryChart() {
        const ctx = document.getElementById('category-chart').getContext('2d');
        
        // Calculate totals by category
        const categoryData = {};
        this.categories.forEach(category => {
            categoryData[category] = 0;
        });
        
        this.expenses.forEach(expense => {
            if (categoryData.hasOwnProperty(expense.category)) {
                categoryData[expense.category] += expense.amount;
            }
        });
        
        // Prepare data for chart
        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        
        // Filter out categories with zero value
        const filteredLabels = [];
        const filteredData = [];
        const filteredColors = [];
        
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
            '#4BC0C0', '#36A2EB'
        ];
        
        labels.forEach((label, index) => {
            if (data[index] > 0) {
                filteredLabels.push(label);
                filteredData.push(data[index]);
                filteredColors.push(colors[index]);
            }
        });
        
        // Destroy previous chart if exists
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }
        
        // Create new chart
        if (filteredData.length > 0) {
            this.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: filteredLabels,
                    datasets: [{
                        data: filteredData,
                        backgroundColor: filteredColors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            // Show empty state
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Poppins';
            ctx.fillStyle = '#aaa';
            ctx.textAlign = 'center';
            ctx.fillText('No data to display', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
    }
    
    // Render monthly chart (bar chart)
    renderMonthlyChart() {
        const ctx = document.getElementById('monthly-chart').getContext('2d');
        
        // Calculate totals by month for current year
        const now = new Date();
        const currentYear = now.getFullYear();
        
        const monthlyData = new Array(12).fill(0);
        
        this.expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            if (expenseDate.getFullYear() === currentYear) {
                const month = expenseDate.getMonth();
                monthlyData[month] += expense.amount;
            }
        });
        
        // Get month abbreviations for labels
        const monthLabels = this.months.map(month => month.substring(0, 3));
        
        // Destroy previous chart if exists
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }
        
        // Create new chart
        this.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Expenses ($)',
                    data: monthlyData,
                    backgroundColor: 'rgba(38, 208, 206, 0.7)',
                    borderColor: 'rgba(38, 208, 206, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Clear all expenses
    clearAllExpenses() {
        this.expenses = [];
        this.saveExpenses();
        this.renderExpenses();
        this.updateStats();
        this.renderCharts();
        this.updateTrends();
        
        this.showToast('All expenses cleared!', 'success');
    }
    
    // Add sample data for demonstration
    addSampleData() {
        const sampleExpenses = [
            {
                id: 'sample1',
                name: 'Groceries',
                amount: 85.50,
                category: 'Food & Dining',
                date: new Date().toISOString().split('T')[0],
                notes: 'Weekly groceries from supermarket',
                createdAt: new Date().toISOString()
            },
            {
                id: 'sample2',
                name: 'Gasoline',
                amount: 45.00,
                category: 'Transportation',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notes: 'Full tank',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample3',
                name: 'Netflix Subscription',
                amount: 15.99,
                category: 'Entertainment',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notes: 'Monthly subscription',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample4',
                name: 'Electricity Bill',
                amount: 120.75,
                category: 'Utilities',
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notes: 'July electricity bill',
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample5',
                name: 'New Shoes',
                amount: 75.25,
                category: 'Shopping',
                date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notes: 'Running shoes',
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample6',
                name: 'Dinner at Restaurant',
                amount: 65.80,
                category: 'Food & Dining',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notes: 'Celebrating anniversary',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        // Add sample expenses
        sampleExpenses.forEach(expense => {
            // Check if sample already exists
            if (!this.expenses.find(e => e.id === expense.id)) {
                this.expenses.unshift(expense);
            }
        });
        
        // Save to localStorage
        this.saveExpenses();
        
        // Update UI
        this.renderExpenses();
        this.updateStats();
        this.renderCharts();
        this.updateTrends();
        
        this.showToast('Sample data added!', 'success');
    }
    
    // Export data as JSON
    exportData() {
        const dataStr = JSON.stringify(this.expenses, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `expenses-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('Data exported successfully!', 'success');
    }
    
    // Show budget modal
    showBudgetModal() {
        const budgetInput = document.getElementById('monthly-budget');
        budgetInput.value = this.monthlyBudget || '';
        
        this.showModal('budget-modal');
        this.updateBudgetStatus();
    }
    
    // Save budget
    saveBudget() {
        const budgetInput = document.getElementById('monthly-budget').value;
        const budgetAmount = parseFloat(budgetInput);
        
        if (isNaN(budgetAmount) || budgetAmount < 0) {
            alert('Please enter a valid budget amount');
            return;
        }
        
        this.monthlyBudget = budgetAmount;
        localStorage.setItem('monthlyBudget', budgetAmount.toString());
        
        this.updateBudgetStatus();
        this.closeAllModals();
        
        this.showToast('Monthly budget saved!', 'success');
    }
    
    // Update budget status display
    updateBudgetStatus() {
        const budgetStatus = document.getElementById('budget-status');
        
        if (!this.monthlyBudget) {
            budgetStatus.innerHTML = '<p>No budget set. Enter a monthly budget above.</p>';
            return;
        }
        
        // Calculate current month expenses
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthExpenses = this.expenses.reduce((sum, expense) => {
            const expenseDate = new Date(expense.date);
            if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
                return sum + expense.amount;
            }
            return sum;
        }, 0);
        
        const percentage = (monthExpenses / this.monthlyBudget) * 100;
        const remaining = this.monthlyBudget - monthExpenses;
        
        let statusClass = 'good';
        let statusText = 'Within budget';
        
        if (percentage >= 90) {
            statusClass = 'warning';
            statusText = 'Approaching budget limit';
        }
        
        if (percentage >= 100) {
            statusClass = 'danger';
            statusText = 'Over budget';
        }
        
        budgetStatus.innerHTML = `
            <div class="budget-summary">
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="progress-text">${percentage.toFixed(1)}% of budget used</div>
                </div>
                <div class="budget-numbers">
                    <div class="budget-item">
                        <span>Budget:</span>
                        <span class="budget-value">$${this.monthlyBudget.toFixed(2)}</span>
                    </div>
                    <div class="budget-item">
                        <span>Spent:</span>
                        <span class="budget-value">$${monthExpenses.toFixed(2)}</span>
                    </div>
                    <div class="budget-item">
                        <span>Remaining:</span>
                        <span class="budget-value ${remaining < 0 ? 'negative' : ''}">$${remaining.toFixed(2)}</span>
                    </div>
                </div>
                <div class="budget-status-text ${statusClass}">
                    <i class="fas fa-${percentage >= 100 ? 'exclamation-triangle' : percentage >= 90 ? 'exclamation-circle' : 'check-circle'}"></i>
                    ${statusText}
                </div>
            </div>
        `;
        
        // Add CSS for budget status
        const style = document.createElement('style');
        style.textContent = `
            .budget-summary { margin-top: 20px; }
            .budget-progress { margin-bottom: 20px; }
            .progress-bar { 
                height: 20px; 
                background-color: #f0f0f0; 
                border-radius: 10px; 
                overflow: hidden; 
                margin-bottom: 8px;
            }
            .progress-fill { 
                height: 100%; 
                transition: width 0.5s; 
            }
            .progress-fill.good { background-color: #4CAF50; }
            .progress-fill.warning { background-color: #FF9800; }
            .progress-fill.danger { background-color: #FF4757; }
            .progress-text { 
                text-align: center; 
                font-size: 0.9rem; 
                color: #666; 
            }
            .budget-numbers { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 20px;
            }
            .budget-item { 
                text-align: center; 
            }
            .budget-item span:first-child { 
                display: block; 
                font-size: 0.9rem; 
                color: #666; 
                margin-bottom: 5px;
            }
            .budget-value { 
                font-size: 1.2rem; 
                font-weight: 600; 
            }
            .budget-value.negative { 
                color: #FF4757; 
            }
            .budget-status-text { 
                text-align: center; 
                padding: 10px; 
                border-radius: 8px; 
                font-weight: 600;
            }
            .budget-status-text.good { 
                background-color: rgba(76, 175, 80, 0.1); 
                color: #2E7D32; 
            }
            .budget-status-text.warning { 
                background-color: rgba(255, 152, 0, 0.1); 
                color: #EF6C00; 
            }
            .budget-status-text.danger { 
                background-color: rgba(255, 71, 87, 0.1); 
                color: #D32F2F; 
            }
        `;
        
        // Remove existing style if any
        const existingStyle = document.getElementById('budget-status-style');
        if (existingStyle) existingStyle.remove();
        
        style.id = 'budget-status-style';
        document.head.appendChild(style);
    }
    
    // Show confirmation modal
    showConfirmModal(title, message, callback) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        this.confirmCallback = callback;
        this.showModal('confirm-modal');
    }
    
    // Show modal
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.editingExpenseId = null;
        this.confirmCallback = null;
    }
    
    // Show toast notification
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to container
        const container = document.querySelector('.container');
        container.appendChild(toast);
        
        // Add CSS for toast
        const style = document.createElement('style');
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: white;
                color: #333;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 15px;
                z-index: 10000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s;
                border-left: 5px solid #26d0ce;
            }
            .toast.success {
                border-left-color: #4CAF50;
            }
            .toast i {
                font-size: 1.5rem;
            }
            .toast.success i {
                color: #4CAF50;
            }
            .toast.show {
                transform: translateY(0);
                opacity: 1;
            }
        `;
        
        // Remove existing style if any
        const existingStyle = document.getElementById('toast-style');
        if (existingStyle) existingStyle.remove();
        
        style.id = 'toast-style';
        document.head.appendChild(style);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide and remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const expensesTracker = new ExpensesTracker();
    
    // Make it available globally for debugging
    window.expensesTracker = expensesTracker;
});