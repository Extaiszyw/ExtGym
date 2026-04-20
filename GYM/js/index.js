window.onload = () => {
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
        window.location.href = 'dashboard.html'
    }
}
