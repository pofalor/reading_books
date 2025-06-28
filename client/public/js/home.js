$(document).ready(function() {
    // Инициализация поиска
    $('#search-btn').click(performSearch);
    $('#search-input').keypress(function(e) {
        if (e.which === 13) performSearch();
    });

    // Инициализация фильтров
    $('#genre-filter, #author-filter').change(applyFilters);

    // Обработка клика по книге
    $('.book-card').click(function() {
        const bookId = $(this).data('id');
        window.location.href = `/book/${bookId}`;
    });
});

function performSearch() {
    const query = $('#search-input').val().trim();
    if (query.length > 0) {
        window.location.href = `/?search=${encodeURIComponent(query)}`;
    }
}

function applyFilters() {
    const genreId = $('#genre-filter').val();
    const authorId = $('#author-filter').val();
    
    let queryParams = [];
    if (genreId) queryParams.push(`genre=${genreId}`);
    if (authorId) queryParams.push(`author=${authorId}`);
    
    if (queryParams.length > 0) {
        window.location.href = `/?${queryParams.join('&')}`;
    } else {
        window.location.href = '/';
    }
}