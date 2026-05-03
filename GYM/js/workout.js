import { supabase } from './supabase.js'

let exercises = []
let editWorkoutId = null // если редактируем существующую

function logout() {
    localStorage.removeItem('currentUser')
    window.location.href = 'login.html'
}

window.onload = async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
    if (!currentUser) {
        window.location.href = 'login.html'
        return
    }

    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('ru', {
        weekday: 'long', day: 'numeric', month: 'long'
    })

    // Проверяем редактируем ли существующую тренировку
    const params = new URLSearchParams(window.location.search)
    editWorkoutId = params.get('edit')

    if (editWorkoutId) {
        document.querySelector('.header h1').textContent = 'Редактировать тренировку'
        document.querySelector('.btn-finish').textContent = 'Сохранить изменения'
        await loadWorkoutForEdit()
    } else {
        loadFromPlan()
    }
}

async function loadWorkoutForEdit() {
    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', editWorkoutId)
        .single()

    if (error || !data) {
        console.error(error)
        loadFromPlan()
        return
    }

    exercises = data.exercises.map(ex => ({
        ...ex,
        id: ex.id || Date.now() + Math.random()
    }))

    renderExercises()
}

function loadFromPlan() {
    const plan = JSON.parse(localStorage.getItem('plan') || 'null')

    if (!plan) {
        renderExercises()
        return
    }

    const todayIndex = new Date().getDay()
    const planIndex = todayIndex === 0 ? 6 : todayIndex - 1
    const todayPlan = plan[planIndex]

    if (todayPlan && !todayPlan.rest && todayPlan.exercises.length > 0) {
        exercises = todayPlan.exercises.map(ex => ({
            id: Date.now() + Math.random(),
            name: ex.name,
            sets: Array.from({ length: parseInt(ex.sets) || 1 }, () => ({
                reps: ex.reps || '',
                weight: ''
            }))
        }))
    }

    renderExercises()
}

function addExercise() {
    exercises.push({ id: Date.now(), name: '', sets: [{ reps: '', weight: '' }] })
    renderExercises()
}

function removeExercise(id) {
    exercises = exercises.filter(e => e.id !== id)
    renderExercises()
}

function addSet(id) {
    exercises.find(e => e.id === id).sets.push({ reps: '', weight: '' })
    renderExercises()
}

function removeSet(id, setIndex) {
    const ex = exercises.find(e => e.id === id)
    if (ex.sets.length === 1) return
    ex.sets.splice(setIndex, 1)
    renderExercises()
}

function updateName(id, value) {
    exercises.find(e => e.id === id).name = value
    updateSummary()
}

function updateSet(id, setIndex, field, value) {
    exercises.find(e => e.id === id).sets[setIndex][field] = value
    updateSummary()
}

function renderExercises() {
    const list = document.getElementById('exerciseList')

    if (exercises.length === 0) {
        list.innerHTML = `<p class="empty">Нет упражнений — добавь вручную или настрой <a href="plan.html">план</a></p>`
        updateSummary()
        return
    }

    list.innerHTML = exercises.map(ex => `
        <div class="exercise-card">
            <div class="exercise-card__header">
                <input
                    class="exercise-name"
                    type="text"
                    placeholder="Название упражнения"
                    value="${ex.name}"
                    oninput="updateName(${ex.id}, this.value)"
                />
                <button class="btn-remove" onclick="removeExercise(${ex.id})">✕</button>
            </div>
            <div class="sets-header">
                <span>Подход</span>
                <span>Повторения</span>
                <span>Вес (кг)</span>
                <span></span>
            </div>
            ${ex.sets.map((set, i) => `
                <div class="set-row">
                    <span class="set-number">${i + 1}</span>
                    <input
                        type="number"
                        placeholder="${set.reps || '8'}"
                        value="${set.reps}"
                        oninput="updateSet(${ex.id}, ${i}, 'reps', this.value)"
                    />
                    <input
                        type="number"
                        placeholder="кг"
                        value="${set.weight}"
                        oninput="updateSet(${ex.id}, ${i}, 'weight', this.value)"
                    />
                    <button class="btn-remove-set" onclick="removeSet(${ex.id}, ${i})">✕</button>
                </div>
            `).join('')}
            <button class="btn-add-set" onclick="addSet(${ex.id})">
                + Добавить подход
            </button>
        </div>
    `).join('')

    updateSummary()
}

function updateSummary() {
    let totalSets = 0
    let totalVolume = 0

    exercises.forEach(ex => {
        totalSets += ex.sets.length
        ex.sets.forEach(set => {
            totalVolume += (parseFloat(set.reps) || 0) * (parseFloat(set.weight) || 0)
        })
    })

    document.getElementById('totalExercises').textContent = exercises.length
    document.getElementById('totalSets').textContent = totalSets
    document.getElementById('totalVolume').textContent = totalVolume + ' кг'
}

async function finishWorkout() {
    if (exercises.length === 0) {
        alert('Добавь хотя бы одно упражнение!')
        return
    }

    if (exercises.some(ex => !ex.name.trim())) {
        alert('Введи название для каждого упражнения!')
        return
    }

    let totalVolume = 0
    exercises.forEach(ex => {
        ex.sets.forEach(set => {
            totalVolume += (parseFloat(set.reps) || 0) * (parseFloat(set.weight) || 0)
        })
    })

    const currentUser = JSON.parse(localStorage.getItem('currentUser'))

    if (editWorkoutId) {
        // Обновляем существующую
        const { error } = await supabase
            .from('workouts')
            .update({
                exercises: exercises,
                volume: totalVolume
            })
            .eq('id', editWorkoutId)

        if (error) {
            alert('Ошибка сохранения!')
            console.error(error)
            return
        }
    } else {
        // Создаём новую
        const { error } = await supabase
            .from('workouts')
            .insert([{
                user_id: currentUser.id,
                date: new Date().toISOString(),
                exercises: exercises,
                volume: totalVolume
            }])

        if (error) {
            alert('Ошибка сохранения!')
            console.error(error)
            return
        }
    }

    window.location.href = 'dashboard.html'
}

window.addExercise = addExercise
window.removeExercise = removeExercise
window.addSet = addSet
window.removeSet = removeSet
window.updateName = updateName
window.updateSet = updateSet
window.finishWorkout = finishWorkout
window.logout = logout
