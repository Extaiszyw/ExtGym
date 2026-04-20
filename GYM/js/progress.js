const workouts = JSON.parse(localStorage.getItem('workouts') || '[]')

window.onload = () => {
    renderStats()
    renderVolumeChart()
    fillExerciseSelect()
    renderHistory()
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (!currentUser) {
        window.location.href = 'login.html'
        return
    }

}

function renderStats() {
    document.getElementById('totalWorkouts').textContent = workouts.length

    const totalVolume = workouts.reduce((sum, w) => sum + (w.volume || 0), 0)
    document.getElementById('totalVolume').textContent = totalVolume.toLocaleString('ru') + ' кг'

    const weekMap = {}
    workouts.forEach(w => {
        const week = getWeekKey(new Date(w.date))
        weekMap[week] = (weekMap[week] || 0) + 1
    })
    const bestWeek = Math.max(...Object.values(weekMap), 0)
    document.getElementById('bestWeek').textContent = bestWeek + ' тр.'

    document.getElementById('streak').textContent = calcStreak() + ' 🔥'
}

function getWeekKey(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().split('T')[0]
}

function calcStreak() {
    if (workouts.length === 0) return 0
    const dates = [...new Set(workouts.map(w =>
        new Date(w.date).toISOString().split('T')[0]
    ))].sort().reverse()

    let streak = 0
    let current = new Date()
    current.setHours(0, 0, 0, 0)

    for (let dateStr of dates) {
        const d = new Date(dateStr)
        const diff = Math.round((current - d) / (1000 * 60 * 60 * 24))
        if (diff <= 1) {
            streak++
            current = d
        } else break
    }
    return streak
}

function renderVolumeChart() {
    const chart = document.getElementById('volumeChart')

    if (workouts.length === 0) {
        chart.innerHTML = '<p class="empty">Нет данных</p>'
        return
    }

    const weekMap = {}
    workouts.forEach(w => {
        const week = getWeekKey(new Date(w.date))
        weekMap[week] = (weekMap[week] || 0) + (w.volume || 0)
    })

    const weeks = Object.keys(weekMap).sort().slice(-8)
    const values = weeks.map(w => weekMap[w])
    const max = Math.max(...values, 1)

    chart.innerHTML = weeks.map((week, i) => `
        <div class="bar-col">
            <span class="bar-value">${Math.round(values[i]).toLocaleString('ru')}</span>
            <div class="bar" style="height: ${(values[i] / max) * 140}px"></div>
            <span class="bar-label">${formatWeek(week)}</span>
        </div>
    `).join('')
}

function formatWeek(weekKey) {
    const d = new Date(weekKey)
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fillExerciseSelect() {
    const names = new Set()
    workouts.forEach(w => {
        w.exercises.forEach(ex => {
            if (ex.name && ex.name.trim()) names.add(ex.name.trim())
        })
    })

    const select = document.getElementById('exerciseSelect')
    names.forEach(name => {
        const option = document.createElement('option')
        option.value = name
        option.textContent = name
        select.appendChild(option)
    })
}

function renderWeightChart() {
    const name = document.getElementById('exerciseSelect').value
    const chart = document.getElementById('weightChart')

    if (!name) {
        chart.innerHTML = '<p class="empty">Выбери упражнение чтобы увидеть прогресс</p>'
        return
    }

    const points = []
    workouts.forEach(w => {
        w.exercises.forEach(ex => {
            if (ex.name && ex.name.trim() === name) {
                const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0))
                if (maxWeight > 0) {
                    points.push({ date: new Date(w.date), weight: maxWeight })
                }
            }
        })
    })

    if (points.length === 0) {
        chart.innerHTML = '<p class="empty">Нет данных по этому упражнению</p>'
        return
    }

    points.sort((a, b) => a.date - b.date)

    const max = Math.max(...points.map(p => p.weight))
    const min = Math.min(...points.map(p => p.weight))
    const range = max - min || 1
    const W = 700, H = 160, pad = 40
    const step = (W - pad * 2) / (points.length - 1 || 1)

    const coords = points.map((p, i) => ({
        x: pad + i * step,
        y: H - pad - ((p.weight - min) / range) * (H - pad * 2)
    }))

    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
    const area = `M ${coords[0].x} ${H - pad} ` +
        coords.map(c => `L ${c.x} ${c.y}`).join(' ') +
        ` L ${coords[coords.length - 1].x} ${H - pad} Z`

    chart.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
            <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <line x1="${pad}" y1="${pad}" x2="${W - pad}" y2="${pad}" stroke="#1e1e1e" stroke-width="1"/>
            <line x1="${pad}" y1="${H / 2}" x2="${W - pad}" y2="${H / 2}" stroke="#1e1e1e" stroke-width="1"/>
            <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#1e1e1e" stroke-width="1"/>
            <text x="${pad - 8}" y="${pad + 4}" fill="#555" font-size="11" text-anchor="end">${max}кг</text>
            <text x="${pad - 8}" y="${H / 2 + 4}" fill="#555" font-size="11" text-anchor="end">${Math.round((max + min) / 2)}кг</text>
            <text x="${pad - 8}" y="${H - pad + 4}" fill="#555" font-size="11" text-anchor="end">${min}кг</text>
            <path d="${area}" fill="url(#grad)"/>
            <path d="${line}" fill="none" stroke="#00e5ff" stroke-width="2" stroke-linejoin="round"/>
            ${coords.map((c, i) => `
                <circle cx="${c.x}" cy="${c.y}" r="4" fill="#00e5ff"/>
                <text x="${c.x}" y="${H - 8}" fill="#555" font-size="10" text-anchor="middle">
                    ${points[i].date.getDate()}.${String(points[i].date.getMonth() + 1).padStart(2, '0')}
                </text>
            `).join('')}
        </svg>
    `
}

function renderHistory() {
    const list = document.getElementById('historyList')

    if (workouts.length === 0) {
        list.innerHTML = '<p class="empty">Тренировок пока нет</p>'
        return
    }

    list.innerHTML = [...workouts].reverse().map(w => `
        <div class="history__item">
            <span class="history__date">
                ${new Date(w.date).toLocaleDateString('ru', { day: 'numeric', month: 'long', weekday: 'short' })}
            </span>
            <div class="history__exercises">
                ${w.exercises.map(ex => `
                    <span class="history__ex">${ex.name}</span>
                `).join('')}
            </div>
            <span class="history__volume">${(w.volume || 0).toLocaleString('ru')} кг</span>
        </div>
    `).join('')
}