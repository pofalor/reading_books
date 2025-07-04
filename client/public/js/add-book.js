document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Dropzone для загрузки файла книги
    Dropzone.autoDiscover = false;
    
    const bookDropzone = new Dropzone("#book-dropzone", {
        url: "/api/books/upload",
        paramName: "bookFile",
        maxFiles: 1,
        acceptedFiles: ".pdf,.docx,.txt",
        dictDefaultMessage: "",
        addRemoveLinks: true,
        init: function() {
            this.on("success", function(file, response) {
                document.getElementById('file-info').textContent = 
                    `Файл загружен: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                document.getElementById('file-info').dataset.fileId = response.fileId;
            });
            
            this.on("removedfile", function() {
                document.getElementById('file-info').textContent = "";
                delete document.getElementById('file-info').dataset.fileId;
            });
        }
    });

    // Загрузка авторов и жанров
    Promise.all([
        fetch('/api/authors').then(res => res.json()),
        fetch('/api/genres').then(res => res.json())
    ]).then(([authors, genres]) => {
        const authorSelect = document.getElementById('author-select');
        const genreSelect = document.getElementById('genre-select');
        
        // Заполняем авторов
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author.id;
            option.textContent = `${author.lastName} ${author.firstName}`;
            authorSelect.appendChild(option);
        });
        
        // Заполняем жанры (с multiple select)
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });
    });

    // Превью обложки
    document.getElementById('cover-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('cover-image').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Обработка формы
    document.getElementById('add-book-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            pagesCount: document.getElementById('pages-count').value,
            authorId: document.getElementById('author-select').value,
            genres: Array.from(document.getElementById('genre-select').selectedOptions)
                      .map(option => option.value),
            fileId: document.getElementById('file-info').dataset.fileId,
            coverFile: document.getElementById('cover-upload').files[0],
            newAuthor: null,
            newGenre: null
        };
        
        // Проверка нового автора
        if (!formData.authorId) {
            const firstName = document.getElementById('author-first-name').value;
            const lastName = document.getElementById('author-last-name').value;
            
            if (firstName && lastName) {
                formData.newAuthor = {
                    firstName,
                    lastName,
                    middleName: document.getElementById('author-middle-name').value || null
                };
            } else {
                alert('Пожалуйста, выберите существующего автора или создайте нового');
                return;
            }
        }
        
        // Проверка нового жанра
        const newGenre = document.getElementById('new-genre').value;
        if (newGenre) {
            formData.newGenre = {
                name: newGenre,
                description: document.getElementById('new-genre-description').value || ''
            };
        }
        
        // Проверка обязательных полей
        if (!formData.title || !formData.pagesCount || !formData.fileId) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        // Создаем FormData для отправки файлов
        const fd = new FormData();
        for (const key in formData) {
            if (formData[key] !== null) {
                fd.append(key, formData[key]);
            }
        }
        
        // Отправка данных
        fetch('/api/books', {
            method: 'POST',
            body: fd
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Книга успешно добавлена!');
                window.location.href = '/book/' + data.bookId;
            } else {
                alert('Ошибка: ' + (data.message || 'Не удалось добавить книгу'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Произошла ошибка при отправке данных');
        });
    });
});