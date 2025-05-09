const form = document.querySelector('#form');
const taskInput = document.querySelector('#taskInput');
const descriptionInput = document.querySelector('#descriptionInput');
const tagsInput = document.querySelector('#tagsInput');
const dueDateInput = document.querySelector('#dueDateInput');
const priorityInput = document.querySelector('#priorityInput');
const tasksList = document.querySelector('#tasksList');
const searchInput = document.querySelector('#searchInput');
const priorityFilter = document.querySelector('#priorityFilter');
const tagFilter = document.querySelector('#tagFilter');
const dueDateFilter = document.querySelector('#dueDateFilter');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let filteredTasks = [...tasks];

// Функция дебаунса для фильтров
function debounce(func, delay) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), delay);
    };
}

// Инициализация списка задач и тегов
function initializeFilters() {
    const tags = Array.from(new Set(tasks.flatMap(task => task.tags)));
    tagFilter.innerHTML = '<option value="all">Все теги</option>';
    tags.forEach(tag => {
        tagFilter.innerHTML += `<option value="${tag}">${tag}</option>`;
    });
}

// Функция фильтрации задач с оптимизацией производительности
function filterTasks() {
    filteredTasks = tasks;

    const query = searchInput.value.toLowerCase();
    if (query) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query)
        );
    }

    const selectedPriority = priorityFilter.value;
    if (selectedPriority !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === selectedPriority);
    }

    const selectedTag = tagFilter.value;
    if (selectedTag !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.tags.includes(selectedTag));
    }

    const selectedDueDate = dueDateFilter.value;
    const today = new Date().toISOString().split('T')[0];
    if (selectedDueDate === 'overdue') {
        filteredTasks = filteredTasks.filter(task => task.dueDate < today);
    } else if (selectedDueDate === 'today') {
        filteredTasks = filteredTasks.filter(task => task.dueDate === today);
    } else if (selectedDueDate === 'future') {
        filteredTasks = filteredTasks.filter(task => task.dueDate > today);
    }

    tasksList.innerHTML = '';
    filteredTasks.forEach(renderTask);
}

// Инициализация списка задач
tasks.forEach(renderTask);
initializeFilters();
setInterval(saveToLocalStorage, 30000);

// Добавление задачи
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = taskInput.value;
    const description = descriptionInput.value;
    const tags = tagsInput.value.split(',').map(tag => tag.trim());
    const dueDate = dueDateInput.value;
    const priority = priorityInput.value;

    if (!title || tags.length === 0) {
        alert('Название и теги обязательны');
        return;
    }

    if (tasks.some(task => task.title === title && task.dueDate === dueDate)) {
        alert('Задача с таким названием и сроком выполнения уже существует');
        return;
    }

    const newTask = {
        id: Date.now(),
        title,
        description: description || '',
        tags,
        dueDate,
        priority,
        done: false
    };

    tasks.push(newTask);
    renderTask(newTask);
    saveToLocalStorage();
    initializeFilters();
    form.reset();
    filterTasks();
});

// Рендеринг задачи с анимацией
function renderTask(task) {
    const doneClass = task.done ? 'task-done' : '';
    const overdueClass = isOverdue(task.dueDate) ? 'task-overdue' : '';
    const taskHTML = `
        <li id="${task.id}" class="task-item ${doneClass} ${overdueClass}" draggable="true" role="listitem" aria-labelledby="task-title-${task.id}" aria-describedby="task-desc-${task.id}" aria-checked="${task.done}">
            <div class="task-content">
                <h5 id="task-title-${task.id}">${task.title}</h5>
                <p id="task-desc-${task.id}">${task.description}</p>
                <small>${task.dueDate} | Приоритет: ${task.priority}</small>
                <div>Теги: ${task.tags.join(', ')}</div>
            </div>
            <div class="task-actions">
                <button data-action="done" class="btn btn-success" aria-label="Отметить как выполненную">✔</button>
                <button data-action="delete" class="btn btn-danger" aria-label="Удалить задачу">✖</button>
            </div>
        </li>
    `;
    tasksList.insertAdjacentHTML('beforeend', taskHTML);

    const taskItem = document.getElementById(task.id);
    setTimeout(() => taskItem.classList.add('show'), 0); // Запускаем анимацию появления
}

// Функция для проверки, просрочена ли задача
function isOverdue(dueDate) {
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
}

// Сохранение в localStorage
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Делегирование событий для кнопок действий
tasksList.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    if (!action) return;

    const taskItem = event.target.closest('li');
    const taskId = Number(taskItem.id);
    const task = tasks.find(t => t.id === taskId);

    if (action === 'delete') {
        taskItem.classList.add('fade-out'); // Анимация исчезновения
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== taskId);
            taskItem.remove();
            saveToLocalStorage();
            filterTasks(); // Обновляем фильтрацию после удаления задачи
        }, 300); // Удаляем после анимации
    } else if (action === 'done') {
        task.done = !task.done;
        taskItem.classList.toggle('task-done', task.done);
        saveToLocalStorage();
        filterTasks(); // Обновляем фильтрацию после изменения состояния
    }
});

// Применяем фильтры с дебаунсом
const debouncedFilterTasks = debounce(filterTasks, 300);
searchInput.addEventListener('input', debouncedFilterTasks);
priorityFilter.addEventListener('change', debouncedFilterTasks);
tagFilter.addEventListener('change', debouncedFilterTasks);
dueDateFilter.addEventListener('change', debouncedFilterTasks);

// Обработка клавиатуры для кнопок действия
tasksList.addEventListener('keydown', (event) => {
    if (event.target.matches('button')) {
        const taskItem = event.target.closest('li');
        const taskId = Number(taskItem.id);
        const task = tasks.find(t => t.id === taskId);
        
        if (event.key === 'Enter') {
            if (event.target.dataset.action === 'done') {
                task.done = !task.done;
                taskItem.classList.toggle('task-done', task.done);
                saveToLocalStorage();
                filterTasks();
            } else if (event.target.dataset.action === 'delete') {
                taskItem.classList.add('fade-out');
                setTimeout(() => {
                    tasks = tasks.filter(t => t.id !== taskId);
                    taskItem.remove();
                    saveToLocalStorage();
                    filterTasks();
                }, 300);
            }
        }
    }
});

// Слушатели для Drag-and-Drop
tasksList.addEventListener('dragstart', (event) => {
    const taskItem = event.target.closest('li');
    if (!taskItem) return;
    event.dataTransfer.setData('text/plain', taskItem.id);
    taskItem.classList.add('dragging');
});

tasksList.addEventListener('dragover', (event) => {
    event.preventDefault();
    const draggingTask = document.querySelector('.dragging');
    const target = event.target.closest('li');
    if (!target || target === draggingTask) return;

    tasksList.insertBefore(draggingTask, target);
});

tasksList.addEventListener('dragend', (event) => {
    const draggingTask = document.querySelector('.dragging');
    if (!draggingTask) return;
    draggingTask.classList.remove('dragging');

    const reorderedTasks = [];
    tasksList.querySelectorAll('li').forEach(taskItem => {
        const taskId = Number(taskItem.id);
        const task = tasks.find(t => t.id === taskId);
        reorderedTasks.push(task);
    });

    tasks = reorderedTasks;
    saveToLocalStorage();
});
