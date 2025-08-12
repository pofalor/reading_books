class BookReader {
    constructor() {
        this.initElements();
        this.initEvents();
    }

    initElements() {
        this.tocItems = document.querySelectorAll('.toc-item');
    }

    initEvents() {
        this.tocItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = e.target.getAttribute('href');
                document.querySelector(targetId)?.scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BookReader();
});