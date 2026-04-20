import { supabase } from './supabase.js'

async function register() {
    const name = document.getElementById('name').value.trim()
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const password2 = document.getElementById('password2').value
    const error = document.getElementById('error')

    if (!name || !email || !password || !password2) {
        error.textContent = 'Заполни все поля'
        return
    }
    if (password.length < 6) {
        error.textContent = 'Пароль минимум 6 символов'
        return
    }
    if (password !== password2) {
        error.textContent = 'Пароли не совпадают'
        return
    }

    // Проверяем не занят ли email
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

    if (existing) {
        error.textContent = 'Этот email уже зарегистрирован'
        return
    }

    // Создаём пользователя
    const { data: user, error: err } = await supabase
        .from('users')
        .insert([{ name, email, password, is_premium: false }])
        .select()
        .single()

    if (err) {
        error.textContent = 'Ошибка регистрации'
        return
    }

    // Сохраняем в localStorage
    localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.is_premium
    }))

    window.location.href = 'dashboard.html'
}

async function login() {
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const error = document.getElementById('error')

    if (!email || !password) {
        error.textContent = 'Заполни все поля'
        return
    }

    const { data: user, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

    if (err || !user) {
        error.textContent = 'Неверный email или пароль'
        return
    }

    localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.is_premium
    }))

    window.location.href = 'dashboard.html'
}

// Делаем функции глобальными
window.register = register
window.login = login