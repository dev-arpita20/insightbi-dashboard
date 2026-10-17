import { useMemo, useState } from "react";
import { salesData } from "./data/dashboardData";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Search,
  Bell,
  Menu,
} from "lucide-react";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [region, setRegion] = useState("All");
  const [category, setCategory] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("asc");

  const filteredData = useMemo(() => {
  return salesData.filter((item) => {
    const regionMatch =
      region === "All" || item.region === region;

    const categoryMatch =
      category === "All" || item.category === category;

    const startDateMatch =
      !startDate || item.date >= startDate;

    const endDateMatch =
      !endDate || item.date <= endDate;

    const searchMatch =
      !search ||
      item.product.toLowerCase().includes(search.toLowerCase()) ||
      item.region.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    return (
      regionMatch &&
      categoryMatch &&
      startDateMatch &&
      endDateMatch &&
      searchMatch
    );
  });
}, [region, category, startDate, endDate, search]);

const sortedData = useMemo(() => {
  return [...filteredData].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];

    if (sortField === "date") {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }

    if (typeof valueA === "string") {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    if (valueA < valueB) {
      return sortDirection === "asc" ? -1 : 1;
    }

    if (valueA > valueB) {
      return sortDirection === "asc" ? 1 : -1;
    }

    return 0;
  });
}, [filteredData, sortField, sortDirection]);

const handleSort = (field) => {
  if (sortField === field) {
    setSortDirection((current) =>
      current === "asc" ? "desc" : "asc"
    );
  } else {
    setSortField(field);
    setSortDirection("asc");
  }
};

const handleExportCSV = () => {
  const headers = [
    "Date",
    "Region",
    "Category",
    "Product",
    "Sales",
    "Profit",
    "Orders",
  ];

  const escapeCSV = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = filteredData.map((item) => [
    item.date,
    item.region,
    item.category,
    item.product,
    item.sales,
    item.profit,
    item.orders,
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "InsightBI-Report.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-US").format(value);
};

  const totalSales = filteredData.reduce(
    (sum, item) => sum + item.sales,
    0
  );

  const totalProfit = filteredData.reduce(
    (sum, item) => sum + item.profit,
    0
  );

  const totalOrders = filteredData.reduce(
    (sum, item) => sum + item.orders,
    0
  );

  const expenseChartData = useMemo(() => {
  return filteredData.map((item) => ({
    month: item.date.slice(0, 7),
    expense: item.sales - item.profit,
  }));
}, [filteredData]);

  const profitMargin =
    totalSales > 0
      ? ((totalProfit / totalSales) * 100)
      : 0;

  const categoryChartData = Object.values(
  filteredData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        name: item.category,
        value: 0,
      };
    }

    acc[item.category].value += item.sales;

    return acc;
  }, 
  {})
);
const revenueChartData = useMemo(() => {
  const monthlyData = filteredData.reduce((acc, item) => {
    const monthKey = item.date.slice(0, 7);

    if (!acc[monthKey]) {
      const date = new Date(`${item.date}T00:00:00`);

      acc[monthKey] = {
        month: date.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        }),
        sales: 0,
        profit: 0,
        orders: 0,
      };
    }

    acc[monthKey].sales += item.sales;
    acc[monthKey].profit += item.profit;
    acc[monthKey].orders += item.orders;

    return acc;
  }, {});

  return Object.keys(monthlyData)
    .sort()
    .map((key) => monthlyData[key]);
}, [filteredData]);

const businessInsights = useMemo(() => {
  if (filteredData.length === 0) {
    return {
      topProduct: "No data",
      topProductRevenue: 0,
      topRegion: "No data",
      topRegionRevenue: 0,
      profitMargin: 0,
    };
  }

  const productTotals = filteredData.reduce((acc, item) => {
    acc[item.product] = (acc[item.product] || 0) + item.sales;
    return acc;
  }, {});

  const regionTotals = filteredData.reduce((acc, item) => {
    acc[item.region] = (acc[item.region] || 0) + item.sales;
    return acc;
  }, {});

  const topProduct = Object.entries(productTotals)
    .sort((a, b) => b[1] - a[1])[0];

  const topRegion = Object.entries(regionTotals)
    .sort((a, b) => b[1] - a[1])[0];

  const totalRevenue = filteredData.reduce(
    (total, item) => total + item.sales,
    0
  );

  const totalProfit = filteredData.reduce(
    (total, item) => total + item.profit,
    0
  );

  const profitMargin =
    totalRevenue > 0
      ? (totalProfit / totalRevenue) * 100
      : 0;

  return {
    topProduct: topProduct[0],
    topProductRevenue: topProduct[1],

    topRegion: topRegion[0],
    topRegionRevenue: topRegion[1],

    profitMargin,
  };
}, [filteredData]);

// Analytics - Category Performance
const analyticsCategoryData = Object.values(
  filteredData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        name: item.category,
        sales: 0,
        profit: 0,
        orders: 0,
      };
    }

    acc[item.category].sales += item.sales;
    acc[item.category].profit += item.profit;
    acc[item.category].orders += item.orders;

    return acc;
  }, {})
);

// Analytics - Region Performance
const analyticsRegionData = Object.values(
  filteredData.reduce((acc, item) => {
    if (!acc[item.region]) {
      acc[item.region] = {
        name: item.region,
        sales: 0,
        profit: 0,
        orders: 0,
      };
    }

    acc[item.region].sales += item.sales;
    acc[item.region].profit += item.profit;
    acc[item.region].orders += item.orders;

    return acc;
  }, {})
);

// Analytics - Product Performance
const analyticsProductData = Object.values(
  filteredData.reduce((acc, item) => {
    if (!acc[item.product]) {
      acc[item.product] = {
        name: item.product,
        sales: 0,
        profit: 0,
        orders: 0,
      };
    }

    acc[item.product].sales += item.sales;
    acc[item.product].profit += item.profit;
    acc[item.product].orders += item.orders;

    return acc;
  }, {})
).sort((a, b) => b.sales - a.sales);

  return (

    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-slate-900 p-6 lg:block">
        <div className="mb-10 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2">
            <LayoutDashboard size={22} />
          </div>

          <div>
            <h1 className="font-bold">InsightBI</h1>
            <p className="text-xs text-slate-400">Analytics Platform</p>
          </div>
        </div>

 <nav className="space-y-2">

  {/* Dashboard */}
  <button
    onClick={() => setActivePage("Dashboard")}
    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
      activePage === "Dashboard"
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    <LayoutDashboard size={18} />
    Dashboard
  </button>


  {/* Sales */}
  <button
    onClick={() => setActivePage("Sales")}
    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
      activePage === "Sales"
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    <TrendingUp size={18} />
    Sales
  </button>


  {/* Finance */}
  <button
    onClick={() => setActivePage("Finance")}
    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
      activePage === "Finance"
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    <DollarSign size={18} />
    Finance
  </button>


  {/* Marketing */}
  <button
    onClick={() => setActivePage("Marketing")}
    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
      activePage === "Marketing"
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    <ShoppingCart size={18} />
    Marketing
  </button>


  {/* Operations */}
  <button
    onClick={() => setActivePage("Operations")}
    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
      activePage === "Operations"
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    <TrendingUp size={18} />
    Operations
  </button>


  {/* HR */}
  <button
    onClick={() => setActivePage("HR")}
    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
      activePage === "HR"
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    <Users size={18} />
    HR
  </button>

</nav>
      </aside>

      {/* Main Content */}

      <main className="lg:ml-64">

{activePage === "Dashboard" ? (
  <div className="p-6 lg:p-8">
    <div className="mb-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-slate-400">
        Business performance at a glance
      </p>
    </div>
    
<div className="mb-4 flex justify-end">
  <button
    onClick={handleExportCSV}
    className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500"
  >
    ↓ Export CSV
  </button>
</div>

{/* Dashboard Filters */}
<div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-5">

  <div>
    <label className="mb-2 block text-sm text-slate-400">Region</label>
    <select
      value={region}
      onChange={(e) => setRegion(e.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
    >
      <option value="All">All Regions</option>
      <option value="North">North</option>
      <option value="South">South</option>
      <option value="East">East</option>
      <option value="West">West</option>
    </select>
  </div>

  <div>
    <label className="mb-2 block text-sm text-slate-400">Category</label>
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
    >
      <option value="All">All Categories</option>
      <option value="Electronics">Electronics</option>
      <option value="Clothing">Clothing</option>
      <option value="Furniture">Furniture</option>
      <option value="Beauty">Beauty</option>
    </select>
  </div>

  <div>
    <label className="mb-2 block text-sm text-slate-400">Start Date</label>
    <input
  type="date"
  value={startDate}
  onChange={(e) => {
    setStartDate(e.target.value);
    if (endDate && e.target.value > endDate) {
      setEndDate("");
    }
  }}
  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
/>
  </div>

  <div>
    <label className="mb-2 block text-sm text-slate-400">End Date</label>
    <input
  type="date"
  value={endDate}
  min={startDate || undefined}
  onChange={(e) => setEndDate(e.target.value)}
  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
/>
  </div>

  <div>
    <label className="mb-2 block text-sm text-slate-400">Search</label>
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search product..."
      className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
    />
  </div>

</div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Revenue"
        value={`$${totalSales.toLocaleString("en-US")}`}
        change="Current period"
        icon={<DollarSign size={20} />}
      />

      <MetricCard
        title="Total Profit"
        value={`$${totalProfit.toLocaleString("en-US")}`}
        change="Current period"
        icon={<TrendingUp size={20} />}
      />

      <MetricCard
        title="Total Orders"
        value={totalOrders.toLocaleString("en-US")}
        change="Current period"
        icon={<ShoppingCart size={20} />}
      />

      <MetricCard
        title="Profit Margin"
        value={`${profitMargin.toFixed(1)}%`}
        change="Current period"
        icon={<Users size={20} />}
      />
    </div>

    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold">Revenue Overview</h2>
      <p className="mt-2 text-sm text-slate-400">
        Monthly revenue and profit
      </p>

      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
) : activePage === "Finance" ? (

  <div className="p-6 lg:p-8">

    <div className="mb-8">
      <h1 className="text-3xl font-bold">
        Finance
      </h1>

      <p className="mt-2 text-slate-400">
        Financial performance and profitability analysis
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Total Revenue
        </p>

        <h2 className="mt-3 text-2xl font-bold">
          ${totalSales.toLocaleString()}
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Total Profit
        </p>

        <h2 className="mt-3 text-2xl font-bold text-emerald-400">
          ${totalProfit.toLocaleString()}
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Total Orders
        </p>

        <h2 className="mt-3 text-2xl font-bold">
          {totalOrders.toLocaleString()}
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          Profit Margin
        </p>

        <h2 className="mt-3 text-2xl font-bold">
          {profitMargin.toFixed(1)}%
        </h2>
      </div>

    </div>

<div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
  <h2 className="text-xl font-semibold">
    Financial Overview
  </h2>

  <p className="mt-2 text-sm text-slate-400">
    Revenue and profit generated from the selected business data.
  </p>

  <div className="h-80 mt-6">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={revenueChartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

        <XAxis
          dataKey="month"
          stroke="#64748b"
        />

        <YAxis
          stroke="#64748b"
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "12px",
          }}
        />

        <Line
          type="monotone"
          dataKey="sales"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={false}
        />

        <Line
          type="monotone"
          dataKey="profit"
          stroke="#22c55e"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>


<div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
  <h2 className="text-xl font-semibold">
    Expense Analysis
  </h2>

  <p className="mt-2 text-sm text-slate-400">
    Expenses calculated from selected business data.
  </p>

  <div className="mt-6 h-80">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={expenseChartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

        <XAxis
          dataKey="month"
          stroke="#64748b"
        />

        <YAxis
          stroke="#64748b"
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #s334155",
            borderRadius: "12px",
          }}
        />

        <Bar
          dataKey="expense"
          fill="#ef4444"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

{/* Financial Summary Table */}
<div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
  <h2 className="text-xl font-semibold">
    Financial Summary
  </h2>

  <p className="mt-2 text-sm text-slate-400">
    Revenue, profit, expenses and profit margin by transaction.
  </p>

  <div className="mt-6 overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-700 text-slate-400">
          <th className="px-4 py-3">Date</th>
          <th className="px-4 py-3">Region</th>
          <th className="px-4 py-3">Category</th>
          <th className="px-4 py-3">Revenue</th>
          <th className="px-4 py-3">Profit</th>
          <th className="px-4 py-3">Expenses</th>
          <th className="px-4 py-3">Margin</th>
        </tr>
      </thead>

      <tbody>
        {filteredData.map((item) => {
          const expense = item.sales - item.profit;
          const margin =
            item.sales > 0
              ? ((item.profit / item.sales) * 100).toFixed(1)
              : "0.0";

          return (
            <tr
              key={item.id}
              className="border-b border-slate-800 hover:bg-slate-800/50"
            >
              <td className="px-4 py-3">{item.date}</td>
              <td className="px-4 py-3">{item.region}</td>
              <td className="px-4 py-3">{item.category}</td>
              <td className="px-4 py-3">
                ${item.sales.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-emerald-400">
                ${item.profit.toLocaleString()}
              </td>
              <td className="px-4 py-3">
                ${expense.toLocaleString()}
              </td>
              <td className="px-4 py-3">
                {margin}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
  </div>
) : activePage === "Sales" ? (
<>
{/* Sales Page */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <Menu className="lg:hidden" />

              <div>
                <h2 className="text-2xl font-bold">
                  Business Intelligence Dashboard
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Monitor business performance and key metrics
                </p>
              </div>
            </div>
          </div>

          <button className="rounded-xl border border-slate-800 p-3 hover:bg-slate-900">
            <Bell size={18} />
          </button>
        </header>

        <section className="space-y-6 p-6">

  {/* Filters */}
  <div className="flex flex-wrap gap-4">
    <select
      value={region}
      onChange={(e) => setRegion(e.target.value)}
      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm"
    >
      <option value="All">All Regions</option>
      <option value="North">North</option>
      <option value="South">South</option>
      <option value="East">East</option>
      <option value="West">West</option>
    </select>

    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm"
    >
      <option value="All">All Categories</option>
      <option value="Electronics">Electronics</option>
      <option value="Clothing">Clothing</option>
      <option value="Furniture">Furniture</option>
      <option value="Beauty">Beauty</option>
       </select>

    {/* Start Date */}
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-400">
        From
      </label>

      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white"
      />
    </div>

    {/* End Date */}
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-400">
        To
      </label>

      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white"
      />
    </div>

    {/* Clear Filters */}
    <button
      onClick={() => {
        setRegion("All");
        setCategory("All");
        setStartDate("");
        setEndDate("");
        setSearch("");
      }}
      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800"
    >
      Clear Filters
    </button>
  </div>
          {/* KPI Cards */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
           <MetricCard
              title="Total Revenue"
              value={`$${totalSales.toLocaleString()}`}
              change="+18.4%"
              icon={<DollarSign size={20} />}
          />


            <MetricCard
              title="Total Profit"
              value={`$${totalProfit.toLocaleString()}`}
              change="+14.2%"
              icon={<TrendingUp size={20} />}
              />

            <MetricCard
              title="Total Orders"
              value={totalOrders.toLocaleString()}
              change="+9.7%"
              icon={<ShoppingCart size={20} />}
              />

            <MetricCard
              title="Profit Margin"
              value={`${profitMargin}%`}
              change="+2.4%"
              icon={<TrendingUp size={20} />}
            />
          </div>

          {/* Charts */}

          <div className="grid gap-6 xl:grid-cols-3">
            {/* Revenue Chart */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">
              <div className="mb-6">
                <h3 className="font-semibold">Revenue Overview</h3>
                <p className="text-sm text-slate-400">
                  Monthly revenue and profit
                </p>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#395b93"
                    />

                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                    />

                    <YAxis stroke="#64748b" />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Chart */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="font-semibold">Sales by Category</h3>

              <p className="mb-4 text-sm text-slate-400">
                Revenue distribution
              </p>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={
                            [
                              "#3b82f6",
                              "#22c55e",
                              "#a855f7",
                              "#f59e0b",
                            ][index]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Orders */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="font-semibold">Recent Orders</h3>

                <p className="text-sm text-slate-400">
                  Search and filter business transactions
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
  Showing {sortedData.length} transaction{sortedData.length !== 1 ? "s" : ""}
</p>

              <div className="flex flex-col gap-3 sm:flex-row">
                {/* Search */}

                <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 px-3">
                  <Search size={17} className="text-slate-500" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search product, region, category..."
                    className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                  />
                </div>

                {/* Filter */}

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none"
                >
                  <option>All</option>
                  <option>Electronics</option>
                  <option>Clothing</option>
                  <option>Furniture</option>
                  <option>Beauty</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
  <table className="w-full text-left text-sm">
    <thead className="border-b border-slate-800 text-slate-400">
      <tr>
 <th
  className="px-4 py-3 cursor-pointer hover:text-white"
  onClick={() => handleSort("date")}
>
  Date {sortField === "date" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
</th>

<th className="px-4 py-3">
  Region
</th>

<th className="px-4 py-3">
  Category
</th>

<th className="px-4 py-3">
  Product
</th>

<th
  className="px-4 py-3 cursor-pointer hover:text-white"
  onClick={() => handleSort("sales")}
>
  Sales {sortField === "sales" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
</th>

<th
  className="px-4 py-3 cursor-pointer hover:text-white"
  onClick={() => handleSort("profit")}
>
  Profit {sortField === "profit" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
</th>

<th
  className="px-4 py-3 cursor-pointer hover:text-white"
  onClick={() => handleSort("orders")}
>
  Orders {sortField === "orders" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
</th>
      </tr>
    </thead>

    <tbody>
     {sortedData.length > 0 ? (
       sortedData.map((item) => (
        <tr
          key={item.id}
          className="border-b border-slate-800 hover:bg-slate-900/60"
        >
          <td className="px-4 py-4">
            {item.date}
          </td>

          <td className="px-4 py-4">
            {item.region}
          </td>

          <td className="px-4 py-4">
            {item.category}
          </td>

          <td className="px-4 py-4 font-medium">
            {item.product}
          </td>

          <td className="px-4 py-4">
            ${item.sales.toLocaleString()}
          </td>

          <td className="px-4 py-4">
            ${item.profit.toLocaleString()}
          </td>

          <td className="px-4 py-4">
            {item.orders.toLocaleString()}
          </td>
             </tr>
    ))
  ) : (
    <tr>
      <td
        colSpan="7"
        className="px-4 py-10 text-center"
      >
        <div className="text-3xl mb-2">🔍</div>

        <p className="font-semibold text-white">
          No transactions found
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Try changing your search or filters.
        </p>
      </td>
    </tr>
  )}
   </tbody>
</table>
</div>
</div>
</section>
{/* Analytics Section */}
<section id="analytics" className="space-y-6 p-6">

  {/* Analytics Header */}
  <div>
    <h2 className="text-2xl font-bold">
      Analytics
    </h2>

    <p className="text-sm text-slate-400 mt-1">
      Detailed performance analysis of your business
    </p>
  </div>
  {/* Business Insights */}

<div className="mt-6 grid gap-4 md:grid-cols-3">

  {/* Top Product */}
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
    <div className="mb-3 flex items-center gap-2">
      <span className="text-xl">🏆</span>

      <span className="text-sm font-medium text-slate-400">
        Top Product
      </span>
    </div>

    <h3 className="text-xl font-bold text-white">
      {businessInsights.topProduct}
    </h3>

    <p className="mt-2 text-sm text-slate-400">
      Revenue:{" "}
      <span className="font-semibold text-blue-400">
        ${businessInsights.topProductRevenue.toLocaleString()}
      </span>
    </p>
  </div>


  {/* Top Region */}
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
    <div className="mb-3 flex items-center gap-2">
      <span className="text-xl">📍</span>

      <span className="text-sm font-medium text-slate-400">
        Top Region
      </span>
    </div>

    <h3 className="text-xl font-bold text-white">
      {businessInsights.topRegion}
    </h3>

    <p className="mt-2 text-sm text-slate-400">
      Revenue:{" "}
      <span className="font-semibold text-emerald-400">
        ${businessInsights.topRegionRevenue.toLocaleString()}
      </span>
    </p>
  </div>


  {/* Profit Margin */}
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
    <div className="mb-3 flex items-center gap-2">
      <span className="text-xl">💰</span>

      <span className="text-sm font-medium text-slate-400">
        Profit Margin
      </span>
    </div>

    <h3 className="text-2xl font-bold text-white">
      {businessInsights.profitMargin.toFixed(1)}%
    </h3>

    <p className="mt-2 text-sm text-slate-400">
      Based on selected data
    </p>
  </div>

</div>

  {/* Category & Region Charts */}
  <div className="grid gap-6 xl:grid-cols-2">

    {/* Category Performance */}
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <div className="mb-6">
        <h3 className="font-semibold">
          Category Performance
        </h3>

        <p className="text-sm text-slate-400">
          Revenue by category
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analyticsCategoryData}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
            />

            <XAxis
              dataKey="name"
              stroke="#64748b"
            />

            <YAxis
              stroke="#64748b"
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "12px",
              }}
            />

            <Bar
              dataKey="sales"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
            />

          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>


    {/* Region Performance */}
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <div className="mb-6">
        <h3 className="font-semibold">
          Regional Performance
        </h3>

        <p className="text-sm text-slate-400">
          Revenue generated by region
        </p>
      </div>

      <div className="h-80">

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analyticsRegionData}>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
            />

            <XAxis
              dataKey="name"
              stroke="#64748b"
            />

            <YAxis
              stroke="#64748b"
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "12px",
              }}
            />

            <Bar
              dataKey="sales"
              fill="#22c55e"
              radius={[6, 6, 0, 0]}
            />

          </BarChart>
        </ResponsiveContainer>

      </div>

    </div>

  </div>


  {/* Product Performance */}
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

    <div className="mb-6">
      <h3 className="font-semibold">
        Product Performance
      </h3>

      <p className="text-sm text-slate-400">
        Top products ranked by revenue
      </p>
    </div>

    <div className="overflow-x-auto">

      <table className="w-full text-left text-sm">

        <thead className="border-b border-slate-800 text-slate-400">

          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Revenue</th>
            <th className="px-4 py-3">Profit</th>
            <th className="px-4 py-3">Orders</th>
          </tr>

        </thead>

        <tbody>

          {analyticsProductData.slice(0, 5).map((product) => (

            <tr
              key={product.name}
              className="border-b border-slate-800 hover:bg-slate-800/50"
            >

              <td className="px-4 py-4 font-medium">
                {product.name}
              </td>

              <td className="px-4 py-4">
                ${product.sales.toLocaleString()}
              </td>

              <td className="px-4 py-4 text-green-400">
                ${product.profit.toLocaleString()}
              </td>

              <td className="px-4 py-4">
                {product.orders.toLocaleString()}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  </div>

</section>
</>
) : activePage === "Marketing" ? (
<div className="p-6 lg:p-8">

  {/* Marketing Header */}
  <div className="mb-8">
    <h1 className="text-3xl font-bold">Marketing</h1>
    <p className="mt-2 text-slate-400">
      Track marketing performance and customer engagement
    </p>
  </div>

  {/* KPI Cards */}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

    <MetricCard
      title="Total Campaigns"
      value="24"
      change="+12.5%"
      icon={<ShoppingCart size={20} />}
    />

    <MetricCard
      title="Conversion Rate"
      value="8.6%"
      change="+5.2%"
      icon={<TrendingUp size={20} />}
    />

    <MetricCard
      title="Marketing Revenue"
      value="$284,500"
      change="+16.8%"
      icon={<DollarSign size={20} />}
    />

    <MetricCard
      title="Customer Reach"
      value="124K"
      change="+21.4%"
      icon={<Users size={20} />}
    />

  </div>

  {/* Marketing Overview */}
  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

    <h2 className="text-xl font-semibold">
      Marketing Performance
    </h2>

    <p className="mt-2 text-sm text-slate-400">
      Campaign performance and customer acquisition overview.
    </p>

    <div className="mt-6 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[
            { month: "Jan", campaigns: 18 },
            { month: "Feb", campaigns: 24 },
            { month: "Mar", campaigns: 31 },
            { month: "Apr", campaigns: 27 },
            { month: "May", campaigns: 36 },
            { month: "Jun", campaigns: 42 },
          ]}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
          />

          <XAxis
            dataKey="month"
            stroke="#64748b"
          />

          <YAxis
            stroke="#64748b"
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "12px"
            }}
          />

          <Bar
            dataKey="campaigns"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
          />

        </BarChart>
      </ResponsiveContainer>
    </div>

  </div>
  {/* Conversion Trend */}
<div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

  <h2 className="text-xl font-semibold">
    Conversion Trend
  </h2>

  <p className="mt-2 text-sm text-slate-400">
    Monthly conversion rate performance.
  </p>

  <div className="mt-6 h-80">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={[
          { month: "Jan", rate: 5.2 },
          { month: "Feb", rate: 6.1 },
          { month: "Mar", rate: 7.4 },
          { month: "Apr", rate: 6.8 },
          { month: "May", rate: 8.1 },
          { month: "Jun", rate: 8.6 },
        ]}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#334155"
        />

        <XAxis
          dataKey="month"
          stroke="#64748b"
        />

        <YAxis
          stroke="#64748b"
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "12px"
          }}
        />

        <Line
          type="monotone"
          dataKey="rate"
          stroke="#22c55e"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

</div>

</div>
) : activePage === "Operations" ? (
  <div className="p-6 lg:p-8">

  {/* Operations Header */}
  <div className="mb-8">
    <h1 className="text-3xl font-bold">
      Operations
    </h1>

    <p className="mt-2 text-slate-400">
      Monitor operational efficiency and order fulfillment
    </p>
  </div>

  {/* KPI Cards */}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

    <MetricCard
      title="Total Orders"
      value="506"
      change="+9.7%"
      icon={<ShoppingCart size={20} />}
    />

    <MetricCard
      title="Fulfillment Rate"
      value="94.2%"
      change="+3.8%"
      icon={<TrendingUp size={20} />}
    />

    <MetricCard
      title="Avg Processing"
      value="2.4 hrs"
      change="-8.5%"
      icon={<TrendingUp size={20} />}
    />

    <MetricCard
      title="On-Time Delivery"
      value="91.6%"
      change="+5.4%"
      icon={<ShoppingCart size={20} />}
    />

  </div>

  {/* Operations Performance */}
  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">

    <h2 className="text-xl font-semibold">
      Operations Performance
    </h2>

    <p className="mt-2 text-sm text-slate-400">
      Monthly order fulfillment and operational efficiency.
    </p>

    <div className="mt-6 h-80">

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[
            { month: "Jan", orders: 72 },
            { month: "Feb", orders: 81 },
            { month: "Mar", orders: 94 },
            { month: "Apr", orders: 86 },
            { month: "May", orders: 108 },
            { month: "Jun", orders: 116 },
          ]}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
          />

          <XAxis
            dataKey="month"
            stroke="#64748b"
          />

          <YAxis
            stroke="#64748b"
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "12px"
            }}
          />

          <Bar
            dataKey="orders"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
          />

        </BarChart>
      </ResponsiveContainer>

    </div>

  </div>
{/* Efficiency Trend */}
<div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
  <h2 className="text-xl font-semibold">
    Efficiency Trend
  </h2>

  <p className="mt-2 text-sm text-slate-400">
    Monthly operational efficiency
  </p>

  <div className="mt-6 h-80">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={[
          { month: "Jan", efficiency: 82 },
          { month: "Feb", efficiency: 85 },
          { month: "Mar", efficiency: 88 },
          { month: "Apr", efficiency: 86 },
          { month: "May", efficiency: 91 },
          { month: "Jun", efficiency: 94 },
        ]}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#334155"
        />

        <XAxis
          dataKey="month"
          stroke="#64748b"
        />

        <YAxis
          stroke="#64748b"
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "12px"
          }}
        />

        <Line
          type="monotone"
          dataKey="efficiency"
          stroke="#22c55e"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
</div>
) : activePage === "HR" ? (
<div className="p-6 lg:p-8">

  {/* HR Header */}
  <div className="mb-8">
    <h1 className="text-3xl font-bold">HR Dashboard</h1>
    <p className="mt-2 text-slate-400">
      Monitor employee performance and workforce insights
    </p>
  </div>

  {/* KPI Cards */}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

    <MetricCard
      title="Total Employees"
      value="248"
      change="+6.4%"
      icon={<Users size={20} />}
    />

    <MetricCard
      title="Employee Growth"
      value="+6.4%"
      change="+2.1%"
      icon={<TrendingUp size={20} />}
    />

    <MetricCard
      title="Attendance Rate"
      value="94.8%"
      change="+1.8%"
      icon={<Users size={20} />}
    />

    <MetricCard
      title="Open Positions"
      value="18"
      change="-10.0%"
      icon={<ShoppingCart size={20} />}
    />

  </div>

  {/* Employee Growth */}
  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <h2 className="text-xl font-semibold">Employee Growth</h2>
    <p className="mt-2 text-sm text-slate-400">
      Monthly workforce growth
    </p>

    <div className="mt-6 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={[
            { month: "Jan", employees: 214 },
            { month: "Feb", employees: 220 },
            { month: "Mar", employees: 226 },
            { month: "Apr", employees: 232 },
            { month: "May", employees: 240 },
            { month: "Jun", employees: 248 },
          ]}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="employees"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* Department Distribution */}
  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <h2 className="text-xl font-semibold">Department Distribution</h2>
    <p className="mt-2 text-sm text-slate-400">
      Employees by department
    </p>

    <div className="mt-6 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[
            { department: "Sales", employees: 62 },
            { department: "Finance", employees: 38 },
            { department: "Marketing", employees: 44 },
            { department: "Operations", employees: 71 },
            { department: "HR", employees: 33 },
          ]}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="department" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "12px",
            }}
          />
          <Bar
            dataKey="employees"
            fill="#22c55e"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* Employee Overview Table */}
  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
    <h2 className="text-xl font-semibold">Employee Overview</h2>
    <p className="mt-2 text-sm text-slate-400">
      Employee performance and attendance
    </p>

    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 text-slate-400">
          <tr>
            <th className="px-4 py-3">Employee ID</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Attendance</th>
            <th className="px-4 py-3">Performance</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b border-slate-800">
            <td className="px-4 py-3">EMP001</td>
            <td className="px-4 py-3">Sales</td>
            <td className="px-4 py-3">96%</td>
            <td className="px-4 py-3">91%</td>
            <td className="px-4 py-3 text-green-400">Active</td>
          </tr>

          <tr className="border-b border-slate-800">
            <td className="px-4 py-3">EMP002</td>
            <td className="px-4 py-3">Finance</td>
            <td className="px-4 py-3">94%</td>
            <td className="px-4 py-3">88%</td>
            <td className="px-4 py-3 text-green-400">Active</td>
          </tr>

          <tr className="border-b border-slate-800">
            <td className="px-4 py-3">EMP003</td>
            <td className="px-4 py-3">Marketing</td>
            <td className="px-4 py-3">92%</td>
            <td className="px-4 py-3">86%</td>
            <td className="px-4 py-3 text-green-400">Active</td>
          </tr>

          <tr>
            <td className="px-4 py-3">EMP004</td>
            <td className="px-4 py-3">Operations</td>
            <td className="px-4 py-3">97%</td>
            <td className="px-4 py-3">93%</td>
            <td className="px-4 py-3 text-green-400">Active</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
) : null}

</main>
</div>
);
}

function MetricCard({ title, value, change, icon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{title}</span>

        <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-bold">{value}</h3>

        <p className="mt-1 text-sm text-green-400">
          {change} <span className="text-slate-500">vs last month</span>
        </p>
      </div>
    </div>
  );
}

export default App;