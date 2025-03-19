export default function BudgetOverview({ budget }: BudgetOverviewProps) {
  if (!budget) return null;

  const totalBudget = Number(budget.total_budget);
  let totalSpent = 0;
  const categories = Object.entries(budget.categories).map(([name, info]) => {
    const amount = Number(info.amount);
    const spent = Number(info.spent || 0);
    totalSpent += spent;
    return {
      name,
      amount,
      spent,
      remaining: amount - spent,
      percentage: amount > 0 ? Math.round((spent / amount) * 100) : 0,
    };
  });

  const remainingTotal = totalBudget - totalSpent;
  const percentageSpent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-white">Budget Overview</h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="text-lg font-semibold text-white">Total Budget</h3>
          <div className="text-right">
            <p className="text-white font-medium">${totalBudget.toLocaleString()}</p>
            <p className="text-sm text-gray-400">
              <span className="text-blue-400">${totalSpent.toLocaleString()}</span> spent ({percentageSpent}%)
              <span className="text-green-400 ml-2">${remainingTotal.toLocaleString()}</span> remaining
            </p>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-md h-4 overflow-hidden">
          <div 
            className={`h-full ${percentageSpent > 90 ? 'bg-red-500' : percentageSpent > 70 ? 'bg-yellow-500' : 'bg-blue-600'}`}
            style={{ width: `${percentageSpent}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.name} className="border border-gray-700 rounded-md p-4 bg-gray-900">
            <div className="flex justify-between items-baseline mb-2">
              <h4 className="text-white font-medium capitalize">{category.name}</h4>
              <div className="text-right">
                <p className="text-white">${category.amount.toLocaleString()}</p>
                <p className="text-sm text-gray-400">
                  <span className="text-blue-400">${category.spent.toLocaleString()}</span> spent ({category.percentage}%)
                  <span className="text-green-400 ml-2">${category.remaining.toLocaleString()}</span> remaining
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-md h-3 overflow-hidden">
              <div 
                className={`h-full ${category.percentage > 90 ? 'bg-red-500' : category.percentage > 70 ? 'bg-yellow-500' : 'bg-blue-600'}`}
                style={{ width: `${category.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 