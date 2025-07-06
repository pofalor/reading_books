// tests/auth.test.js
describe('Auth Module', function() {
    describe('Login', function() {
        it('should return token for valid credentials', function(done) {
            $.ajax({
                url: '/auth/login',
                method: 'POST',
                data: {
                    email: 'test@example.com',
                    password: 'password123'
                },
                success: function(response) {
                    expect(response).to.have.property('token');
                    done();
                },
                error: function(xhr) {
                    done(new Error(xhr.responseText));
                }
            });
        });
        
        it('should return error for invalid credentials', function(done) {
            // Тест для неверных учетных данных
        });
    });
    
    // Другие тесты...
});

// tests/book.test.js
describe('Books Module', function() {
    describe('Get Books', function() {
        it('should return array of books', function(done) {
            $.ajax({
                url: '/api/books',
                method: 'GET',
                success: function(response) {
                    expect(response).to.be.an('array');
                    done();
                },
                error: function(xhr) {
                    done(new Error(xhr.responseText));
                }
            });
        });
    });
    
    // Другие тесты...
});