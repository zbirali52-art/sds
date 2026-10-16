/**
 * ZenCharts: Progress Visualizations & Head-to-Head Analytics
 * Powered by Chart.js with dark-mode aesthetic gradients & glowing curves.
 */
class ZenCharts {
  constructor() {
    this.historyChart = null;
    this.ratioChart = null;
    this.comparisonBarChart = null;
    this.currentTimeframe = 14; // default 14 days
    this.currentSits = [];
  }

  init(sits) {
    this.currentSits = sits || [];
    this.bindControls();
    this.renderAll(this.currentSits);
  }

  bindControls() {
    document.querySelectorAll('.chart-timeframe-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.chart-timeframe-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const days = e.currentTarget.getAttribute('data-days');
        this.currentTimeframe = days === 'all' ? 'all' : parseInt(days, 10);
        this.renderHistoryChart(this.currentSits);
      });
    });
  }

  renderAll(sits) {
    this.currentSits = sits || [];
    this.renderHistoryChart(this.currentSits);
    this.renderComparisonBarChart(this.currentSits);
    this.renderRatioChart(this.currentSits);
    this.renderHeatmap(this.currentSits);
  }

  isUserZabir(s) {
    return s.user === 'Zabir' || (s.displayName && s.displayName.toLowerCase().includes('zabir'));
  }

  isUserSoham(s) {
    return s.user === 'Soham' || (s.displayName && s.displayName.toLowerCase().includes('soham'));
  }

  /**
   * Daily / Weekly comparative line chart for Zabir & Soham
   */
  renderHistoryChart(sits) {
    const canvas = document.getElementById('history-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = [];
    const zabirData = [];
    const sohamData = [];

    const today = new Date();

    let days = this.currentTimeframe === 'all' ? 30 : this.currentTimeframe;
    if (this.currentTimeframe === 'all') {
      const timestamps = sits.map(s => new Date(s.date).getTime()).filter(t => !isNaN(t));
      if (timestamps.length > 0) {
        const oldest = new Date(Math.min(...timestamps));
        const diffDays = Math.ceil((today.getTime() - oldest.getTime()) / (1000 * 3600 * 24)) + 1;
        days = Math.max(14, Math.min(diffDays, 60));
      }
    }

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      labels.push(monthDay);

      // Sum minutes for this date
      const zabirDayMins = sits
        .filter(s => this.isUserZabir(s) && s.date === dateStr)
        .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);

      const sohamDayMins = sits
        .filter(s => this.isUserSoham(s) && s.date === dateStr)
        .reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);

      zabirData.push(Math.round(zabirDayMins * 10) / 10);
      sohamData.push(Math.round(sohamDayMins * 10) / 10);
    }

    if (this.historyChart) {
      this.historyChart.destroy();
    }

    // Cyan Gradient for Zabir
    const gradZabir = ctx.createLinearGradient(0, 0, 0, 280);
    gradZabir.addColorStop(0, 'rgba(0, 245, 212, 0.35)');
    gradZabir.addColorStop(1, 'rgba(0, 245, 212, 0.01)');

    // Violet Gradient for Soham
    const gradSoham = ctx.createLinearGradient(0, 0, 0, 280);
    gradSoham.addColorStop(0, 'rgba(168, 85, 247, 0.38)');
    gradSoham.addColorStop(1, 'rgba(168, 85, 247, 0.01)');

    this.historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Zabir (Mins)',
            data: zabirData,
            borderColor: '#00F5D4',
            backgroundColor: gradZabir,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#00F5D4',
            pointBorderColor: '#020611',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Soham Sadhu (Mins)',
            data: sohamData,
            borderColor: '#A855F7',
            backgroundColor: gradSoham,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#A855F7',
            pointBorderColor: '#020611',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
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
              font: { family: "'Inter', sans-serif", size: 12, weight: 600 },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: 'rgba(8, 16, 32, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(56, 189, 248, 0.25)',
            borderWidth: 1,
            padding: 10,
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
   * Bar comparison: Average Sit Duration, Max Duration, Total Hours
   */
  renderComparisonBarChart(sits) {
    const canvas = document.getElementById('comparison-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const zabirSits = sits.filter(s => this.isUserZabir(s));
    const sohamSits = sits.filter(s => this.isUserSoham(s));

    const zabirTotal = zabirSits.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
    const sohamTotal = sohamSits.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);

    const zabirAvg = zabirSits.length ? Math.round((zabirTotal / zabirSits.length) * 10) / 10 : 0;
    const sohamAvg = sohamSits.length ? Math.round((sohamTotal / sohamSits.length) * 10) / 10 : 0;

    const zabirMax = zabirSits.length ? Math.round(Math.max(...zabirSits.map(s => Number(s.durationMinutes) || 0)) * 10) / 10 : 0;
    const sohamMax = sohamSits.length ? Math.round(Math.max(...sohamSits.map(s => Number(s.durationMinutes) || 0)) * 10) / 10 : 0;

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
            label: 'Soham Sadhu',
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
            labels: { color: '#cbd5e1', usePointStyle: true, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(8, 16, 32, 0.95)',
            titleColor: '#fff',
            borderColor: 'rgba(56, 189, 248, 0.25)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
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

    const isEmpty = (cleanSits === 0 && movedSits === 0);

    this.ratioChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: isEmpty ? ['Awaiting Sits'] : ['Full Stillness (Unbroken)', 'Movement (Time Out)'],
        datasets: [{
          data: isEmpty ? [1] : [cleanSits, movedSits],
          backgroundColor: isEmpty ? ['rgba(255, 255, 255, 0.08)'] : [
            'rgba(0, 245, 212, 0.85)',
            'rgba(244, 63, 94, 0.85)'
          ],
          borderColor: '#020611',
          borderWidth: 2,
          hoverOffset: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              font: { size: 11 },
              usePointStyle: true,
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(8, 16, 32, 0.95)',
            titleColor: '#fff',
            borderColor: 'rgba(56, 189, 248, 0.25)',
            borderWidth: 1,
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
   * 28-Day Activity Heatmap Grid
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

      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';

      let level = '0';
      if (totalMins > 0 && totalMins < 30) level = '1';
      else if (totalMins >= 30 && totalMins < 60) level = '2';
      else if (totalMins >= 60) level = '3';

      cell.setAttribute('data-level', level);
      cell.setAttribute('title', `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${Math.round(totalMins)}m meditated (${daySits.length} sits)`);

      const dayLabel = document.createElement('span');
      dayLabel.className = 'heatmap-day-label';
      dayLabel.textContent = d.getDate();
      cell.appendChild(dayLabel);

      if (hasClean && totalMins >= 15) {
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
