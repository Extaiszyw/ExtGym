const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

let plan = JSON.parse(localStorage.getItem('plan') || 'null') || DAYS.map(day => ({
    day,
    rest: true,
    exercises: []
}))
window.onload = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (!currentUser) {
        window.location.href = 'login.html'
        return
    }

    renderPlan()
}

function renderPlan() {
    const list = document.getElementById('daysList')

    list.innerHTML = plan.map((d, dayIndex) => `
        <div class="day-card ${d.rest ? 'day-card--rest' : ''}">

            <div class="day-card__header">
                <div class="day-info">
                    <h3>${d.day}</h3>
                    ${d.rest
            ? '<span class="badge-rest">Отдых</span>'
            : `<span class="badge-active">${d.exercises.length} упр.</span>`
        }
                </div>
                <label class="toggle">
                    <input type="checkbox" ${!d.rest ? 'checked' : ''} onchange="toggleDay(${dayIndex}, this.checked)"/>
                    <span class="toggle__slider"></span>
                    <span class="toggle__label">${d.rest ? 'День отдыха' : 'Тренировка'}</span>
                </label>
            </div>

            ${!d.rest ? `
                <div class="exercises">
                    ${d.exercises.map((ex, exIndex) => `
                        <div class="exercise-row">
                            <input
                                class="ex-name"
                                type="text"
                                placeholder="Название упражнения"
                                value="${ex.name}"
                                oninput="updateExercise(${dayIndex}, ${exIndex}, 'name', this.value)"
                            />
                            <div class="ex-params">
                                <div class="ex-param">
                                    <label>Подходы</label>
                                    <input
                                        type="number"
                                        placeholder="4"
                                        value="${ex.sets}"
                                        oninput="updateExercise(${dayIndex}, ${exIndex}, 'sets', this.value)"
                                    />
                                </div>
                                <div class="ex-param">
                                    <label>Повторения</label>
                                    <input
                                        type="number"
                                        placeholder="8"
                                        value="${ex.reps}"
                                        oninput="updateExercise(${dayIndex}, ${exIndex}, 'reps', this.value)"
                                    />
                                </div>
                            </div>
                            <button class="btn-remove" onclick="removeExercise(${dayIndex}, ${exIndex})">✕</button>
                        </div>
                    `).join('')}
                </div>

                <button class="btn-add-ex" onclick="addExercise(${dayIndex})">
                    + Добавить упражнение
                </button>
            ` : ''}

        </div>
    `).join('')
}

function toggleDay(dayIndex, isTraining) {
    plan[dayIndex].rest = !isTraining
    if (isTraining && plan[dayIndex].exercises.length === 0) {
        plan[dayIndex].exercises.push({ name: '', sets: '', reps: '' })
    }
    renderPlan()
}

function addExercise(dayIndex) {
    plan[dayIndex].exercises.push({ name: '', sets: '', reps: '' })
    renderPlan()
}

function removeExercise(dayIndex, exIndex) {
    plan[dayIndex].exercises.splice(exIndex, 1)
    renderPlan()
}

function updateExercise(dayIndex, exIndex, field, value) {
    plan[dayIndex].exercises[exIndex][field] = value
}

function savePlan() {
    localStorage.setItem('plan', JSON.stringify(plan))
    const btn = document.querySelector('.btn-save')
    btn.textContent = '✅ Сохранено!'
    btn.style.background = 'rgba(0, 229, 255, 0.15)'
    btn.style.color = 'var(--cyan)'
    setTimeout(() => {
        btn.textContent = 'Сохранить план'
        btn.style.background = ''
        btn.style.color = ''
    }, 2000)
}