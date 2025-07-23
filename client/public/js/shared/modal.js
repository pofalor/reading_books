// Управление модальными окнами
export function setupModal(modalId, closeSelector) {
    const modal = document.getElementById(modalId);
    const close = modal.querySelector(closeSelector);

    close.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    return modal;
}