function logout() {
    localStorage.removeItem('currentUser')
    window.location.href = 'login.html'
}

window.onload = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (!currentUser) {
        window.location.href = 'login.html'
        return
    }

    document.getElementById('sidebarUser').innerHTML = `
        <span class="user-name">${currentUser.name}</span>
        <button class="btn-logout" onclick="logout()">Выйти</button>
    `

    // Проверка подписки
    if (!currentUser.isPremium) {
        document.getElementById('mainContent').style.filter = 'blur(5px)'
        document.getElementById('mainContent').style.pointerEvents = 'none'
        document.getElementById('paywall').style.display = 'flex'
        return
    }

    loadDashboard()
}

function loadDashboard() {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]')
    const plan = JSON.parse(localStorage.getItem('plan') || 'null')

    renderToday(plan)
    renderStats(workouts, plan)
    renderChart(workouts)
    renderRecent(workouts)
}

function renderToday(plan) {
    const el = document.getElementById('todayBlock')
    const todayIndex = new Date().getDay()
    const planIndex = todayIndex === 0 ? 6 : todayIndex - 1

    if (!plan) {
        el.innerHTML = `<p class="empty">План не настроен. <a href="plan.html">Настроить</a></p>`
        return
    }

    const today = plan[planIndex]

    if (today.rest) {
        el.innerHTML = `
            <div class="rest-day">
                <span>😴 Сегодня день отдыха</span>
                <a href="plan.html" class="btn-outline">Изменить план</a>
            </div>
        `
    } else {
        el.innerHTML = `
            <div class="today-exercises">
                ${today.exercises.map(ex => `
                    <div class="today-ex">
                        <span class="today-ex__name">${ex.name}</span>
                        <span class="today-ex__meta">${ex.sets} подх. × ${ex.reps} повт.</span>
                    </div>
                `).join('')}
            </div>
            <button class="btn-start" onclick="window.location.href='workout.html'">
                Начать тренировку
            </button>
        `
    }
}

function renderStats(workouts, plan) {
    document.getElementById('totalWorkouts').textContent = workouts.length

    const daysPerWeek = plan ? plan.filter(d => !d.rest).length : 0
    const weekWorkouts = getThisWeekWorkouts(workouts)

    document.getElementById('weekWorkouts').textContent = `${weekWorkouts} / ${daysPerWeek}`

    const progress = daysPerWeek > 0
        ? Math.min(Math.round((weekWorkouts / daysPerWeek) * 100), 100)
        : 0

    document.getElementById('weekProgress').style.width = progress + '%'
    document.getElementById('weekProgressText').textContent = progress + '%'
}

function getThisWeekWorkouts(workouts) {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)
    return workouts.filter(w => new Date(w.date) >= startOfWeek).length
}

function renderChart(workouts) {
    const chart = document.getElementById('volumeChart')
    const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
    const volumes = [0, 0, 0, 0, 0, 0, 0]

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    workouts.forEach(w => {
        const date = new Date(w.date)
        if (date >= startOfWeek) {
            const dayIndex = (date.getDay() + 6) % 7
            volumes[dayIndex] += w.volume || 0
        }
    })

    const max = Math.max(...volumes, 1)

    chart.innerHTML = days.map((day, i) => `
        <div class="chart__col">
            <div class="chart__bar" style="height: ${(volumes[i] / max) * 100}%"></div>
            <span class="chart__label">${day}</span>
        </div>
    `).join('')
}

function renderRecent(workouts) {
    const list = document.getElementById('recentList')

    if (workouts.length === 0) {
        list.innerHTML = '<p class="empty">Тренировок пока нет. Начни первую!</p>'
        return
    }

    list.innerHTML = [...workouts].reverse().map(w => `
        <div class="recent__item">
            <span class="recent__date">
                ${new Date(w.date).toLocaleDateString('ru', { day: 'numeric', month: 'long', weekday: 'short' })}
            </span>
            <span class="recent__info">${w.exercises.length} упр. — ${w.volume} кг</span>
            <button class="btn-delete" onclick="deleteWorkout(${w.id})">🗑</button>
        </div>
    `).join('')
}

function deleteWorkout(id) {
    if (!confirm('Удалить тренировку?')) return
    let workouts = JSON.parse(localStorage.getItem('workouts') || '[]')
    workouts = workouts.filter(w => w.id !== id)
    localStorage.setItem('workouts', JSON.stringify(workouts))
    loadDashboard()
}

function clearHistory() {
    if (!confirm('Удалить все тренировки?')) return
    localStorage.removeItem('workouts')
    loadDashboard()
}