/**
 * ZenCharts: Progress Visualizations & Head-to-Head Analytics
 * Powered by Chart.js with dark-mode aesthetic gradients & glowing curves.
 */
class ZenCharts {
  constructor() {
    this.historyChart = null;
    this.ratioChart = null;
    this.comparisonBarChart = null;
  }

  init(sits) {
    this.renderAll(sits);
  }

  renderAll(sits) {
    this.renderHistoryChart(sits);
    this.renderComparisonBarChart(sits);
    this.renderRatioChart(sits);
    this.renderHeatmap(sits);
  }

  /**
   * Daily / Weekly comparative line chart for Zabir & Soham
   */
  renderHistoryChart(sits) {
    const canvas = document.getElementById('history-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Aggregate last 14 days
    const days = 14;
    const labels = [];
    const zabirData = [];
    const sohamData = [];

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(monthDay);

      // Sum minutes for this date
      const zabirDayMins = sits
        .filter(s => s.user === 'Zabir' && s.date === dateStr)
        .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);

      const sohamDayMins = sits
        .filter(s => s.user === 'Soham' && s.date === dateStr)
        .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);

      zabirData.push(zabirDayMins);
      sohamData.push(sohamDayMins);
    }

    if (this.historyChart) {
      this.historyChart.destroy();
    }

    // Cyan Gradient for Zabir
    const gradZabir = ctx.createLinearGradient(0, 0, 0, 300);
    gradZabir.addColorStop(0, 'rgba(0, 245, 212, 0.35)');
    gradZabir.addColorStop(1, 'rgba(0, 245, 212, 0.01)');

    // Violet Gradient for Soham
    const gradSoham = ctx.createLinearGradient(0, 0, 0, 300);
    gradSoham.addColorStop(0, 'rgba(121, 40, 202, 0.40)');
    gradSoham.addColorStop(1, 'rgba(121, 40, 202, 0.01)');

    this.historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Zabir (Minutes)',
            data: zabirData,
            borderColor: '#00F5D4',
            backgroundColor: gradZabir,
            borderWidth: 2.8,
            tension: 0.38,
            fill: true,
            pointBackgroundColor: '#00F5D4',
            pointBorderColor: '#090a10',
            pointBorderWidth: 2,
            pointRadius: 4.5,
            pointHoverRadius: 7
          },
          {
            label: 'Soham (Minutes)',
            data: sohamData,
            borderColor: '#A855F7',
            backgroundColor: gradSoham,
            borderWidth: 2.8,
            tension: 0.38,
            fill: true,
            pointBackgroundColor: '#A855F7',
            pointBorderColor: '#090a10',
            pointBorderWidth: 2,
            pointRadius: 4.5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#cbd5e1',
              font: { family: "'Inter', sans-serif", size: 13, weight: 600 },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 18, 29, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(ctx) {
                return `${ctx.dataset.label}: ${ctx.raw} mins`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              callback: value => value + ' m',
              font: { size: 11 }
            }
          }
        }
      }
    });
  }

  /**
   * Bar comparison: Total Minutes, Average Sit Duration, Max Duration
   */
  renderComparisonBarChart(sits) {
    const canvas = document.getElementById('comparison-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const zabirSits = sits.filter(s => s.user === 'Zabir');
    const sohamSits = sits.filter(s => s.user === 'Soham');

    const zabirTotal = zabirSits.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
    const sohamTotal = sohamSits.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);

    const zabirAvg = zabirSits.length ? Math.round(zabirTotal / zabirSits.length) : 0;
    const sohamAvg = sohamSits.length ? Math.round(sohamTotal / sohamSits.length) : 0;

    const zabirMax = zabirSits.length ? Math.max(...zabirSits.map(s => Number(s.durationMinutes) || 0)) : 0;
    const sohamMax = sohamSits.length ? Math.max(...sohamSits.map(s => Number(s.durationMinutes) || 0)) : 0;

    if (this.comparisonBarChart) {
      this.comparisonBarChart.destroy();
    }

    this.comparisonBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Avg Sit (min)', 'Best Sit (min)', 'Total Hours'],
        datasets: [
          {
            label: 'Zabir',
            data: [zabirAvg, zabirMax, +(zabirTotal / 60).toFixed(1)],
            backgroundColor: 'rgba(0, 245, 212, 0.75)',
            borderColor: '#00F5D4',
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: 'Soham',
            data: [sohamAvg, sohamMax, +(sohamTotal / 60).toFixed(1)],
            backgroundColor: 'rgba(168, 85, 247, 0.75)',
            borderColor: '#A855F7',
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#cbd5e1', usePointStyle: true }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 18, 29, 0.95)',
            titleColor: '#fff',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }

  /**
   * Stillness vs Movement (Time Out) Ratio
   */
  renderRatioChart(sits) {
    const canvas = document.getElementById('ratio-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const cleanSits = sits.filter(s => s.status === 'completed').length;
    const movedSits = sits.filter(s => s.status === 'timeout').length;

    if (this.ratioChart) {
      this.ratioChart.destroy();
    }

    this.ratioChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Unbroken Stillness (Target Achieved)', 'Movement (Time Out Called)'],
        datasets: [{
          data: [cleanSits || 1, movedSits || 0],
          backgroundColor: [
            'rgba(0, 245, 212, 0.85)',
            'rgba(247, 37, 133, 0.75)'
          ],
          borderColor: '#090a10',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              font: { size: 12 },
              usePointStyle: true,
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 18, 29, 0.95)',
            titleColor: '#fff',
            callbacks: {
              label: function(ctx) {
                const total = cleanSits + movedSits;
                const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                return `${ctx.label}: ${ctx.raw} sits (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * 30-Day Activity Heatmap Grid for Stillness
   */
  renderHeatmap(sits) {
    const container = document.getElementById('heatmap-grid');
    if (!container) return;

    container.innerHTML = '';
    const today = new Date();
    const daysToShow = 28;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const daySits = sits.filter(s => s.date === dateStr);
      const totalMins = daySits.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
      const hasClean = daySits.some(s => s.status === 'completed');
      const hasTimeout = daySits.some(s => s.status === 'timeout');

      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';

      let level = '0';
      if (totalMins > 0 && totalMins < 30) level = '1';
      else if (totalMins >= 30 && totalMins < 60) level = '2';
      else if (totalMins >= 60 && totalMins < 90) level = '3';
      else if (totalMins >= 90) level = '4';

      cell.setAttribute('data-level', level);
      cell.setAttribute('title', `${d.toDateString()}: ${totalMins} mins meditated (${daySits.length} sits)`);

      const dayLabel = document.createElement('span');
      dayLabel.className = 'heatmap-day-label';
      dayLabel.textContent = d.getDate();
      cell.appendChild(dayLabel);

      if (hasClean && totalMins >= 60) {
        const star = document.createElement('span');
        star.className = 'heatmap-badge';
        star.textContent = '★';
        cell.appendChild(star);
      }

      container.appendChild(cell);
    }
  }
}

window.zenCharts = new ZenCharts();
