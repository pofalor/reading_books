document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('payment-form');
    const modal = document.getElementById('payment-modal');
    const loader = modal.querySelector('.payment-loader');
    const successResult = modal.querySelector('.payment-result.success');
    const failedResult = modal.querySelector('.payment-result.failed');
    const tryAgainBtn = modal.querySelector('.try-again');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Показываем модальное окно с лоадером
        modal.style.display = 'flex';
        loader.classList.add('active');
        successResult.classList.remove('active');
        failedResult.classList.remove('active');

        try {

            const urlParams = new URLSearchParams(window.location.search);
            const bookId = urlParams.get('bookId');
            const response = await fetch(`/api/transaction/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bookId })
            });

            const result = await response.json();

            // Показываем результат
            loader.classList.remove('active');

            if (result.success) {
                successResult.classList.add('active');
            } else {
                const errorText = result.message;
                failedResult.classList.add('active');
                failedResult.querySelector('#failed-trans-text').textContent = errorText;
            }
        } catch (error) {
            console.error('Ошибка:', error);
            loader.classList.remove('active');
            failedResult.classList.add('active');
        }
    });

    tryAgainBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    // Закрытие модального окна при клике вне его
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Форматирование номера карты
    const cardNumberInput = document.getElementById('card-number');
    cardNumberInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\s+/g, '');
        if (value.length > 16) value = value.substr(0, 16);

        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += ' ';
            formatted += value[i];
        }

        e.target.value = formatted;
    });

    // Форматирование срока действия
    const cardExpiryInput = document.getElementById('card-expiry');
    cardExpiryInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substr(0, 2) + '/' + value.substr(2, 2);
        }
        e.target.value = value;
    });

    // Ограничение CVC
    const cardCvcInput = document.getElementById('card-cvc');
    cardCvcInput.addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').substr(0, 3);
    });
});