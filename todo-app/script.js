const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const clearCompletedBtn = document.querySelector("#clear-completed");
const filterButtons = document.querySelectorAll(".filter");
const today = document.querySelector("#today");

const STORAGE_KEY = "todo-app.tasks";

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = "all";

today.textContent = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
}).format(new Date());

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  const activeCount = tasks.filter((task) => !task.completed).length;
  const hasCompleted = tasks.some((task) => task.completed);

  taskList.innerHTML = "";

  visibleTasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;
    item.dataset.id = task.id;

    const checkButton = document.createElement("button");
    checkButton.className = "check";
    checkButton.type = "button";
    checkButton.title = task.completed ? "Mark active" : "Mark complete";
    checkButton.setAttribute("aria-label", checkButton.title);
    checkButton.textContent = "✓";

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const editButton = document.createElement("button");
    editButton.className = "icon-btn";
    editButton.type = "button";
    editButton.title = "Edit task";
    editButton.setAttribute("aria-label", "Edit task");
    editButton.textContent = "✎";

    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-btn";
    deleteButton.type = "button";
    deleteButton.title = "Delete task";
    deleteButton.setAttribute("aria-label", "Delete task");
    deleteButton.textContent = "×";

    item.append(checkButton, text, editButton, deleteButton);
    taskList.append(item);
  });

  taskCount.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left`;
  clearCompletedBtn.disabled = !hasCompleted;
  emptyState.classList.toggle("visible", visibleTasks.length === 0);
}

function addTask(text) {
  tasks.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
  });
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function editTask(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return;
  }

  const nextText = prompt("Edit task", task.text);

  if (nextText === null) {
    return;
  }

  const cleanText = nextText.trim();

  if (!cleanText) {
    return;
  }

  tasks = tasks.map((item) =>
    item.id === id ? { ...item, text: cleanText.slice(0, 80) } : item
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = taskInput.value.trim();

  if (!text) {
    return;
  }

  addTask(text);
  taskForm.reset();
  taskInput.focus();
});

taskList.addEventListener("click", (event) => {
  const taskItem = event.target.closest(".task-item");

  if (!taskItem) {
    return;
  }

  const id = taskItem.dataset.id;

  if (event.target.classList.contains("check")) {
    toggleTask(id);
  }

  if (event.target.title === "Edit task") {
    editTask(id);
  }

  if (event.target.title === "Delete task") {
    deleteTask(id);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((filterButton) => {
      filterButton.classList.toggle("active", filterButton === button);
    });

    renderTasks();
  });
});

clearCompletedBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

renderTasks();
