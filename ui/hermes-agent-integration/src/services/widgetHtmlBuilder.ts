export function buildWidgetHtml(
  widgetType: string,
  config: any,
  theme: "light" | "dark" = "light",
): string {
  const isDark = theme === "dark";
  const textColor = isDark ? "#EBEBEB" : "#666666";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.1)";

  const resizeScript = `
        <script>
            let lastHeight = 0;
            function sendHeight() {
                const container = document.getElementById('widget-container');
                let height;
                
                if (container) {
                    // Measure the exact content height, avoiding viewport stretching
                    height = container.getBoundingClientRect().height;
                    
                    // Add body padding to ensure nothing is cut off
                    const style = window.getComputedStyle(document.body);
                    const paddingTop = parseFloat(style.paddingTop) || 0;
                    const paddingBottom = parseFloat(style.paddingBottom) || 0;
                    height += paddingTop + paddingBottom;
                } else {
                    // Fallback
                    height = document.documentElement.offsetHeight || document.body.offsetHeight;
                }
                
                // Only send if height changed significantly to avoid infinite 1px jitter loops
                if (height && Math.abs(height - lastHeight) > 2) {
                    lastHeight = height;
                    window.parent.postMessage({ type: 'WIDGET_RESIZE', height: height }, '*');
                }
            }
            window.addEventListener('load', sendHeight);
            
            // Use ResizeObserver for real-time updates
            if (window.ResizeObserver) {
                const ro = new ResizeObserver(sendHeight);
                const target = document.getElementById('widget-container') || document.body;
                ro.observe(target);
            }
            
            // Fallback for any late-loading assets
            setTimeout(sendHeight, 500);
            setTimeout(sendHeight, 1500);
            setTimeout(sendHeight, 3000);
        </script>
    `;

  if (widgetType === "portfolio-dashboard") {
    return `
<!DOCTYPE html>
<html lang="en" class="${isDark ? "dark" : ""}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/lucide@0.321.0/dist/umd/lucide.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                    },
                    colors: {
                        pplx: {
                            primary: '${isDark ? "#191919" : "#FFFFFF"}',
                            secondary: '${isDark ? "#202020" : "#F9F9F9"}',
                            accent: '#20B8CD',
                            border: '${isDark ? "#333333" : "#E5E7EB"}',
                            text: '${isDark ? "#EBEBEB" : "#111111"}',
                            muted: '${isDark ? "#9B9B9B" : "#6B7280"}'
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: transparent;
            font-family: 'Inter', system-ui, sans-serif;
            color: ${isDark ? "#EBEBEB" : "#1a1a1a"};
        }
        .premium-card {
            background: ${isDark ? "rgba(31, 31, 31, 0.7)" : "rgba(255, 255, 255, 0.8)"};
            backdrop-filter: blur(12px);
            border: 1px solid ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"};
            border-radius: 1.5rem;
            box-shadow: ${isDark ? "0 20px 40px -15px rgba(0,0,0,0.6)" : "0 10px 30px -10px rgba(0,0,0,0.05)"};
            transition: all 0.3s ease;
        }
        .premium-card:hover {
            transform: translateY(-2px);
            box-shadow: ${isDark ? "0 25px 50px -12px rgba(0,0,0,0.7)" : "0 15px 35px -10px rgba(0,0,0,0.08)"};
        }
        .bg-gradient-premium {
            background: ${isDark ? "radial-gradient(circle at top right, #1a1a1a, #111111)" : "radial-gradient(circle at top right, #ffffff, #f9fafb)"};
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-transparent p-6 md:p-8">
    <!-- Top Nav -->
    <div class="flex justify-between items-center mb-10 border-b border-pplx-border pb-6">
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-[#20B8CD] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-[#20B8CD]/20">D</div>
            <div class="flex flex-col">
                <div class="text-sm font-bold tracking-tight uppercase">Digital Curator</div>
                <div class="text-[9px] text-pplx-muted font-bold uppercase tracking-[0.2em]">Asset Intelligence</div>
            </div>
        </div>
        <div class="hidden md:flex items-center gap-8 text-[10px] font-bold text-pplx-muted uppercase tracking-widest">
            <a href="#" class="text-[#20B8CD]">Portfolio</a>
            <a href="#" class="hover:text-pplx-text transition-all">Analytics</a>
            <a href="#" class="hover:text-pplx-text transition-all">Settings</a>
        </div>
        <div class="flex items-center gap-4">
            <i data-lucide="bell" class="w-4 h-4 text-pplx-muted"></i>
            <div class="w-8 h-8 rounded-full bg-pplx-secondary border border-pplx-border overflow-hidden">
                <img src="https://picsum.photos/seed/user/100/100" alt="User" class="w-full h-full object-cover">
            </div>
        </div>
    </div>

    <!-- Header Stats -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-8">
        <div>
            <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-[0.3em] mb-2">Total Portfolio Value</div>
            <div class="text-5xl font-extrabold tracking-tighter flex items-baseline gap-4">
                €1,420,500
                <span class="text-sm font-medium text-pplx-muted">Live Market Data</span>
            </div>
        </div>
        <div class="flex flex-wrap gap-8 items-center">
            <div class="text-right">
                <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-1">YTD RETURNS</div>
                <div class="text-[#10b981] font-bold text-xl tracking-tight">+12.4%</div>
            </div>
            <div class="text-right">
                <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-1">LAST MONTH</div>
                <div class="text-[#10b981] font-bold text-xl tracking-tight">+4.2%</div>
            </div>
            <div class="flex gap-2 ml-4">
                <button class="px-5 py-2 text-[10px] font-bold border border-pplx-border rounded-xl hover:bg-pplx-secondary transition-all uppercase tracking-widest">EXPORT</button>
                <button class="px-5 py-2 text-[10px] font-bold bg-[#20B8CD] text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#20B8CD]/20 uppercase tracking-widest">NEW ENTRY</button>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content (Left 2/3) -->
        <div class="lg:col-span-2 flex flex-col gap-8">
            <!-- Asset Allocation Card -->
            <div class="premium-card p-8 flex flex-col items-center">
                <div class="flex justify-center mb-8">
                    <div class="flex bg-pplx-secondary border border-pplx-border rounded-xl p-1 text-[10px] font-bold uppercase tracking-wider">
                        <button class="px-4 py-2 bg-pplx-primary rounded-lg shadow-sm">Assets</button>
                        <button class="px-4 py-2 hover:bg-pplx-primary rounded-lg transition-all">Classes</button>
                        <button class="px-4 py-2 hover:bg-pplx-primary rounded-lg transition-all">Sectors</button>
                    </div>
                </div>

                <div class="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
                    <canvas id="allocationChart"></canvas>
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div class="text-5xl font-extrabold tracking-tighter">12+</div>
                        <div class="text-[9px] font-bold text-pplx-muted uppercase tracking-[0.4em] mt-1">Holdings</div>
                    </div>
                </div>

                <div class="mt-10 text-center">
                    <h3 class="text-lg font-bold mb-2">Active Allocation Strategy</h3>
                    <p class="text-xs text-pplx-muted max-w-md mx-auto leading-relaxed">
                        Weighted towards core index trackers with strategic alpha overlays in technology and digital assets.
                    </p>
                </div>
            </div>

            <!-- Periodic Performance Card -->
            <div class="premium-card p-8">
                <div class="flex justify-between items-center mb-8">
                    <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest">Performance (12M)</div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-1.5">
                            <div class="w-2 h-2 rounded-full bg-[#20B8CD]"></div>
                            <span class="text-[8px] font-bold text-pplx-muted uppercase tracking-wider">Gain</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <div class="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                            <span class="text-[8px] font-bold text-pplx-muted uppercase tracking-wider">Loss</span>
                        </div>
                    </div>
                </div>
                
                <div class="h-40 w-full">
                    <canvas id="performanceChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Sidebar (Right 1/3) -->
        <div class="flex flex-col gap-8">
            <!-- Active Strategies Card -->
            <div class="premium-card p-6">
                <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-6">Active Strategies</div>
                <div class="flex flex-col gap-3">
                    <div class="bg-pplx-secondary border border-pplx-border rounded-xl p-4 hover:bg-pplx-accent/5 transition-all cursor-pointer group">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-pplx-accent/10 flex items-center justify-center text-pplx-accent">
                                    <i data-lucide="trending-up" class="w-4 h-4"></i>
                                </div>
                                <div class="text-xs font-bold">Momentum Alpha</div>
                            </div>
                            <div class="text-[7px] font-bold bg-pplx-accent/10 text-pplx-accent px-1.5 py-0.5 rounded uppercase tracking-wider">Active</div>
                        </div>
                        <div class="text-[10px] text-pplx-muted leading-relaxed">Multi-factor trend following</div>
                    </div>

                    <div class="bg-pplx-secondary border border-pplx-border rounded-xl p-4 hover:bg-teal-500/5 transition-all cursor-pointer group">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                                    <i data-lucide="shield" class="w-4 h-4"></i>
                                </div>
                                <div class="text-xs font-bold">Yield Guardian</div>
                            </div>
                            <div class="text-[7px] font-bold bg-teal-500/10 text-teal-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Safe</div>
                        </div>
                        <div class="text-[10px] text-pplx-muted leading-relaxed">Income generation focus</div>
                    </div>
                </div>
            </div>

            <!-- Portfolio Composite Card -->
            <div class="premium-card p-6">
                <div class="flex justify-between items-center mb-6">
                    <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest">Top Assets</div>
                    <button class="text-[8px] font-bold text-[#20B8CD] uppercase tracking-wider hover:underline">View All</button>
                </div>

                <div class="flex flex-col gap-5">
                    <!-- Asset Item -->
                    <div class="flex justify-between items-center group cursor-pointer">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                                <i data-lucide="apple" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <div class="text-[11px] font-bold group-hover:text-[#20B8CD] transition-colors">Apple Inc.</div>
                                <div class="text-[8px] text-pplx-muted uppercase font-bold tracking-wider">Equity</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[11px] font-bold tracking-tight">€142,400</div>
                            <div class="text-[8px] text-[#10b981] font-bold">+0.4%</div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center group cursor-pointer">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                                <i data-lucide="cloud" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <div class="text-[11px] font-bold group-hover:text-[#20B8CD] transition-colors">Microsoft</div>
                                <div class="text-[8px] text-pplx-muted uppercase font-bold tracking-wider">Cloud</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[11px] font-bold tracking-tight">€98,210</div>
                            <div class="text-[8px] text-[#10b981] font-bold">+1.2%</div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center group cursor-pointer">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                                <i data-lucide="bitcoin" class="w-4 h-4 text-orange-500"></i>
                            </div>
                            <div>
                                <div class="text-[11px] font-bold group-hover:text-[#20B8CD] transition-colors">Bitcoin</div>
                                <div class="text-[8px] text-pplx-muted uppercase font-bold tracking-wider">Crypto</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[11px] font-bold tracking-tight">€45,200</div>
                            <div class="text-[8px] text-[#10b981] font-bold">+5.4%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Allocation Donut Chart
        const allocationCtx = document.getElementById('allocationChart').getContext('2d');
        new Chart(allocationCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [10, 7, 14.8, 8, 47.2],
                    backgroundColor: ['#1e293b', '#6366f1', '#3b82f6', '#f59e0b', '#94a3b8'],
                    borderWidth: 0,
                    cutout: '82%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });

        // Performance Bar Chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(performanceCtx, {
            type: 'bar',
            data: {
                labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
                datasets: [{
                    data: [2.5, 3.1, -1.8, 4.2, 5.5, -0.8, 6.2, 3.8, 4.5, -2.1, 5.2, 4.8],
                    backgroundColor: (context) => {
                        const value = context.dataset.data[context.dataIndex];
                        return value >= 0 ? '#20B8CD' : '#EF4444';
                    },
                    borderRadius: 4,
                    barThickness: 16
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: true, grid: { display: false }, ticks: { font: { size: 7, weight: 'bold' }, color: '#9B9B9B' } },
                    y: { display: false }
                }
            }
        });

        // Initialize Lucide icons
        lucide.createIcons();
    </script>
    ${resizeScript}
</body>
</html>`;
  }

  if (widgetType === "chart") {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chart Widget</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            margin: 0;
            padding: 24px;
            padding-bottom: 48px; /* 20% more space at the bottom */
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: transparent;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            overflow: hidden;
        }
        #widget-container {
            width: 100%;
            height: 380px; /* Fixed height to prevent resize loops while giving plenty of space */
            position: relative;
            animation: fadeIn 0.8s ease-out;
        }
        canvas {
            max-width: 100%;
            max-height: 100%;
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.05));
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div id="widget-container">
        <canvas id="myChart"></canvas>
    </div>
    <script>
        try {
            const ctx = document.getElementById('myChart').getContext('2d');
            const config = ${JSON.stringify(config).replace(/</g, "\\u003c")};
            
            // Premium Color Palette
            const colors = {
                primary: '#20B8CD',
                secondary: '#6366f1',
                accent: '#f43f5e',
                success: '#10b981',
                warning: '#f59e0b',
                info: '#3b82f6',
                muted: '${isDark ? "#4b5563" : "#9ca3af"}'
            };

            // Apply theme colors to Chart.js defaults
            Chart.defaults.color = '${textColor}';
            Chart.defaults.borderColor = '${gridColor}';
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.font.size = 12;
            
            // Refine datasets for a premium look
            if (config.data && config.data.datasets) {
                config.data.datasets.forEach((ds, i) => {
                    const palette = [colors.primary, colors.secondary, colors.accent, colors.success, colors.warning, colors.info];
                    const color = palette[i % palette.length];
                    
                    if (!ds.backgroundColor) {
                        ds.backgroundColor = color;
                        ds.borderColor = color;
                    }
                    
                    // Area charts refinement with gradients
                    if (config.type === 'line' || config.type === 'radar') {
                        ds.tension = 0.4;
                        ds.borderWidth = 3;
                        ds.pointRadius = 0; // Hide points by default for cleaner look
                        ds.pointHoverRadius = 6;
                        ds.pointBackgroundColor = '${isDark ? "#191919" : "#ffffff"}';
                        ds.pointBorderColor = color;
                        ds.pointBorderWidth = 2;
                        
                        // Add gradient fill if fill is enabled
                        if (ds.fill || config.type === 'radar') {
                            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                            gradient.addColorStop(0, color + '40'); // 25% opacity
                            gradient.addColorStop(1, color + '00'); // 0% opacity
                            ds.backgroundColor = gradient;
                            ds.fill = true;
                        }
                    }
                    
                    // Bar charts refinement
                    if (config.type === 'bar') {
                        ds.borderRadius = 6;
                        ds.borderSkipped = false;
                        ds.hoverBackgroundColor = ds.backgroundColor || color; // Keep the same color on hover
                        ds.hoverBorderColor = color;
                        ds.barPercentage = 0.6;
                        ds.categoryPercentage = 0.8;
                    }
                    
                    // Doughnut/Pie charts refinement
                    if (config.type === 'doughnut' || config.type === 'pie') {
                        ds.borderWidth = 2;
                        ds.borderColor = '${isDark ? "#191919" : "#ffffff"}';
                        ds.hoverOffset = 4;
                        if (config.type === 'doughnut') {
                            config.options = config.options || {};
                            config.options.cutout = '75%';
                        }
                    }
                });
            }

            if (config.options) {
                config.options.responsive = true;
                config.options.maintainAspectRatio = false;
                config.options.interaction = {
                    mode: 'index',
                    intersect: false,
                };
                
                // Premium Tooltip
                if (!config.options.plugins) config.options.plugins = {};
                config.options.plugins.tooltip = {
                    backgroundColor: '${isDark ? "rgba(39, 39, 42, 0.9)" : "rgba(255, 255, 255, 0.9)"}',
                    titleColor: '${isDark ? "#ffffff" : "#111827"}',
                    bodyColor: '${isDark ? "#e4e4e7" : "#4b5563"}',
                    borderColor: '${isDark ? "#3f3f46" : "#e5e7eb"}',
                    borderWidth: 1,
                    padding: 16,
                    cornerRadius: 12,
                    displayColors: true,
                    usePointStyle: true,
                    boxPadding: 8,
                    bodyFont: { size: 13, family: "'Inter', sans-serif" },
                    titleFont: { size: 14, weight: 'bold', family: "'Inter', sans-serif" },
                    callbacks: {
                        labelColor: function(context) {
                            return {
                                borderColor: context.dataset.borderColor,
                                backgroundColor: context.dataset.borderColor,
                            };
                        }
                    }
                };

                // Ensure scales use theme colors if they exist
                if (config.options.scales) {
                    Object.values(config.options.scales).forEach(scale => {
                        if (!scale.grid) scale.grid = {};
                        scale.grid.color = '${gridColor}';
                        scale.grid.drawBorder = false;
                        scale.grid.tickLength = 0;
                        if (!scale.ticks) scale.ticks = {};
                        scale.ticks.color = '${textColor}';
                        scale.ticks.padding = 12;
                        scale.ticks.font = { size: 11, family: "'Inter', sans-serif" };
                        scale.border = { display: false };
                    });
                }

                // Ensure plugins like legend use theme colors
                if (config.options.plugins.legend) {
                    if (!config.options.plugins.legend.labels) config.options.plugins.legend.labels = {};
                    config.options.plugins.legend.labels.color = '${textColor}';
                    config.options.plugins.legend.labels.usePointStyle = true;
                    config.options.plugins.legend.labels.pointStyle = 'circle';
                    config.options.plugins.legend.labels.padding = 24;
                    config.options.plugins.legend.labels.font = { size: 12, weight: '500', family: "'Inter', sans-serif" };
                    config.options.plugins.legend.position = 'top';
                    config.options.plugins.legend.align = 'end';
                }
            } else {
                config.options = {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: { 
                                color: '${textColor}',
                                usePointStyle: true,
                                pointStyle: 'circle',
                                padding: 24,
                                font: { size: 12, weight: '500', family: "'Inter', sans-serif" }
                            }
                        },
                        tooltip: {
                            backgroundColor: '${isDark ? "rgba(39, 39, 42, 0.9)" : "rgba(255, 255, 255, 0.9)"}',
                            titleColor: '${isDark ? "#ffffff" : "#111827"}',
                            bodyColor: '${isDark ? "#e4e4e7" : "#4b5563"}',
                            borderColor: '${isDark ? "#3f3f46" : "#e5e7eb"}',
                            borderWidth: 1,
                            padding: 16,
                            cornerRadius: 12,
                            usePointStyle: true,
                            boxPadding: 8
                        }
                    },
                    scales: {
                        x: { border: { display: false }, grid: { color: '${gridColor}', drawBorder: false, tickLength: 0 }, ticks: { color: '${textColor}', padding: 12 } },
                        y: { border: { display: false }, grid: { color: '${gridColor}', drawBorder: false, tickLength: 0 }, ticks: { color: '${textColor}', padding: 12 } }
                    }
                };
            }

            // Animation
            config.options.animation = {
                duration: 1000,
                easing: 'easeOutQuart'
            };

            new Chart(ctx, config);
        } catch (error) {
            console.error('Error rendering chart:', error);
            document.body.innerHTML = '<div style="color: red; padding: 20px; background: white;">Error rendering chart: ' + error.message + '</div>';
        }
    </script>
    ${resizeScript}
</body>
</html>`;
  }

  if (widgetType === "mermaid" || widgetType === "diagram") {
    const mermaidCode = typeof config === "string" ? config : config.code || "";
    return `
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background-color: transparent;
            color: ${textColor};
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            overflow: hidden; /* Prevent scrollbars */
        }
        #widget-container {
            padding: 16px;
            padding-bottom: 24px;
            display: flex;
            justify-content: center;
            width: 100%;
            box-sizing: border-box;
        }
        .mermaid {
            background-color: transparent;
            width: 100%;
            display: flex;
            justify-content: center;
            animation: fadeIn 0.8s ease-out;
            margin: 0;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        /* Premium Diagram Styling */
        .mermaid svg {
            filter: drop-shadow(0 15px 25px rgba(0,0,0,0.1));
            max-width: 100% !important;
            max-height: 500px !important; /* Constrain height to prevent massive diagrams */
            height: auto !important; /* Ensure proportional scaling */
        }
        .mermaid .node rect, .mermaid .node circle, .mermaid .node ellipse, .mermaid .node polygon, .mermaid .node path {
            stroke-width: 1.5px !important;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
        }
        .mermaid .edgePath .path {
            stroke-width: 1.5px !important;
            stroke: ${isDark ? "#52525b" : "#94a3b8"} !important;
        }
        .mermaid .label {
            font-family: 'Inter', sans-serif !important;
            font-weight: 600 !important;
            letter-spacing: -0.01em;
        }
        .mermaid .cluster rect {
            fill: ${isDark ? "rgba(24, 24, 27, 0.5)" : "rgba(249, 250, 251, 0.5)"} !important;
            stroke: ${isDark ? "#3f3f46" : "#e5e7eb"} !important;
            rx: 12px;
            ry: 12px;
        }
        /* Class & ER Diagram specific improvements */
        .mermaid .classGroup rect, .mermaid .er.entityBox {
            fill: ${isDark ? "#27272a" : "#ffffff"} !important;
            stroke: ${isDark ? "#3f3f46" : "#e5e7eb"} !important;
            stroke-width: 1.5px !important;
            rx: 8px;
            ry: 8px;
        }
        .mermaid .classLabel .label, .mermaid .er.entityLabel {
            font-weight: 700 !important;
        }
        .mermaid .er.attributeBoxEven {
            fill: ${isDark ? "#18181b" : "#f9fafb"} !important;
        }
        .mermaid .er.attributeBoxOdd {
            fill: ${isDark ? "#27272a" : "#ffffff"} !important;
        }
    </style>
</head>
<body>
    <div id="widget-container">
        <pre class="mermaid">
${mermaidCode}
        </pre>
    </div>
    <script>
        mermaid.initialize({ 
            startOnLoad: true, 
            theme: '${isDark ? "dark" : "neutral"}',
            securityLevel: 'loose',
            fontFamily: 'Inter, sans-serif',
            gantt: {
                fontSize: 12,
                sectionFontSize: 14,
                topPadding: 50,
                bottomPadding: 70, // Fixes text overlap at the bottom
                useWidth: 1200 // Gives gantt charts more breathing room
            },
            sequence: {
                actorMargin: 50,
                messageMargin: 40,
                boxMargin: 10,
                rightAngles: false
            },
            mindmap: {
                padding: 20
            },
            themeVariables: {
                darkMode: ${isDark},
                background: '${isDark ? "#191919" : "#ffffff"}',
                primaryColor: '#20B8CD',
                primaryTextColor: '${textColor}',
                primaryBorderColor: '${isDark ? "#3f3f46" : "#e5e7eb"}',
                lineColor: '${isDark ? "#52525b" : "#d1d5db"}',
                secondaryColor: '${isDark ? "#27272a" : "#f9fafb"}',
                tertiaryColor: '${isDark ? "#18181b" : "#f3f4f6"}',
                mainBkg: '${isDark ? "#27272a" : "#ffffff"}',
                nodeBorder: '${isDark ? "#3f3f46" : "#e5e7eb"}',
                clusterBkg: '${isDark ? "#18181b" : "#f9fafb"}',
                clusterBorder: '${isDark ? "#3f3f46" : "#e5e7eb"}',
                defaultLinkColor: '${isDark ? "#52525b" : "#d1d5db"}',
                titleColor: '${textColor}',
                edgeLabelBackground: '${isDark ? "#27272a" : "#ffffff"}',
                nodeRadius: '8px'
            }
        });
    </script>
    ${resizeScript}
</body>
</html>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: sans-serif; 
            padding: 20px; 
            color: ${textColor}; 
            background-color: ${isDark ? "#191919" : "transparent"};
        }
    </style>
</head>
<body>
    <div>Unsupported widget type: ${widgetType}</div>
    ${resizeScript}
</body>
</html>`;
}
