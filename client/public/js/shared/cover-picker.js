// Поле выбора обложки с превью для форм добавления и редактирования книги.
// Ограничения совпадают с серверными (config/multer.config.js): проверка здесь
// нужна, чтобы не гонять на сервер заведомо неподходящий файл.

export const DEFAULT_COVER = '/images/default-book.jpg';

const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const COVER_MAX_SIZE = 5 * 1024 * 1024;

// prefix — общая часть id элементов: `${prefix}-cover`, `${prefix}-cover-preview`,
// `${prefix}-cover-name`, `${prefix}-cover-remove`
export function createCoverPicker(prefix) {
  const input = document.getElementById(`${prefix}-cover`);
  const preview = document.getElementById(`${prefix}-cover-preview`);
  const nameLabel = document.getElementById(`${prefix}-cover-name`);
  const removeBtn = document.getElementById(`${prefix}-cover-remove`);

  let currentUrl = null; // обложка, которая уже есть у книги (при редактировании)
  let removed = false;   // пользователь попросил убрать текущую обложку
  let objectUrl = null;

  function render() {
    const file = input.files[0];

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    if (file) {
      objectUrl = URL.createObjectURL(file);
      preview.src = objectUrl;
      nameLabel.textContent = file.name;
      removeBtn.textContent = 'Отменить выбор';
    } else if (currentUrl && !removed) {
      preview.src = currentUrl;
      nameLabel.textContent = 'Текущая обложка';
      removeBtn.textContent = 'Удалить обложку';
    } else {
      preview.src = DEFAULT_COVER;
      nameLabel.textContent = removed
        ? 'Обложка будет удалена при сохранении'
        : 'Не выбрана — будет показана стандартная';
    }

    removeBtn.hidden = !file && !(currentUrl && !removed);
  }

  input.addEventListener('change', () => {
    const file = input.files[0];

    if (file && !COVER_TYPES.includes(file.type)) {
      alert('Обложка должна быть в формате JPEG, PNG или WebP');
      input.value = '';
    } else if (file && file.size > COVER_MAX_SIZE) {
      alert('Обложка должна быть не больше 5 МБ');
      input.value = '';
    } else if (file) {
      removed = false;
    }

    render();
  });

  removeBtn.addEventListener('click', () => {
    if (input.files.length > 0) {
      input.value = ''; // сначала отменяем выбранный файл
    } else {
      removed = true;   // затем — текущую обложку книги
    }
    render();
  });

  // Если файл обложки пропал с сервера, показываем стандартную
  preview.addEventListener('error', () => {
    if (!preview.src.endsWith(DEFAULT_COVER)) preview.src = DEFAULT_COVER;
  });

  render();

  return {
    // Сбрасывает выбор; url — текущая обложка книги (null — её нет)
    reset(url = null) {
      currentUrl = url;
      removed = false;
      input.value = '';
      render();
    },

    // Добавляет в FormData новую обложку или просьбу удалить текущую
    appendTo(formData) {
      if (input.files[0]) {
        formData.append('cover', input.files[0]);
      } else if (removed && currentUrl) {
        formData.append('removeCover', 'true');
      }
    }
  };
}
