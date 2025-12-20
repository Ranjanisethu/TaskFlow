let stompClient = null;
let currentUser = null;
let allTasks = []; // Store locally
let currentDetailTaskId = null; // For the detail modal
let charts = {}; // Store chart instances

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    if (currentUser) {
        document.getElementById('username-display').textContent = currentUser;
        connectWebSocket();
        await fetchAndRenderTasks();
    }
});

/* --- Notifications --- */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return; // Should exist

    const div = document.createElement('div');
    div.className = 'glass-panel';
    div.style.padding = '1rem';
    div.style.minWidth = '250px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '0.75rem';
    div.style.borderLeft = type === 'error' ? '4px solid #ef4444' : '4px solid #10b981';
    div.style.background = 'var(--bg-card)'; /* Ensure background prevents transparency issues */
    div.style.animation = 'fadeIn 0.3s ease';

    const icon = type === 'error' ? "<i class='bx bxs-error-circle' style='color:#ef4444; font-size:1.5rem;'></i>"
        : "<i class='bx bxs-check-circle' style='color:#10b981; font-size:1.5rem;'></i>";

    div.innerHTML = `
        ${icon}
        <div style="font-size:0.9rem;">${escapeHtml(message)}</div>
    `;

    container.appendChild(div);

    // Auto remove
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(100%)';
        div.style.transition = 'all 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}


/* --- Auth & Init --- */
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) window.location.href = '/index.html';
        else currentUser = await res.text();
    } catch (err) { window.location.href = '/index.html'; }
}

async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/index.html';
}

function connectWebSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    stompClient.connect({}, function () {
        stompClient.subscribe('/topic/tasks', (msg) => handleTaskUpdate(JSON.parse(msg.body)));
        stompClient.subscribe('/topic/tasks/delete', (msg) => handleTaskDelete(msg.body));
    }, (err) => console.error('WS Error', err));
}

async function fetchAndRenderTasks() {
    try {
        const res = await fetch('/api/tasks');
        allTasks = await res.json();
        renderAllViews();
    } catch (e) { console.error(e); }
}

/* --- View Switching --- */
/* --- View Switching --- */
// (Old switchView removed)


/* --- Rendering --- */
function renderAllViews() {
    const activeView = document.querySelector('.view-section[style*="block"]');
    if (activeView) {
        const viewId = activeView.id.replace('view-', '');
        switchView(viewId);
    } else {
        renderKanban();
        updateCounts(); // Always update badges
    }
}

function renderKanban() {
    document.querySelectorAll('.task-list').forEach(col => col.innerHTML = '');
    allTasks.forEach(task => {
        const colId = `col-${task.status}`;
        const col = document.getElementById(colId);
        if (col) col.appendChild(createTaskCard(task));
    });
    updateCounts();
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    container.innerHTML = '';

    const projects = {};
    allTasks.forEach(t => {
        const p = t.project || "Inbox";
        if (!projects[p]) projects[p] = { count: 0, completed: 0 };
        projects[p].count++;
        if (t.status === 'DONE') projects[p].completed++;
    });

    Object.keys(projects).forEach(pName => {
        const p = projects[pName];
        const percent = Math.round((p.completed / p.count) * 100) || 0;

        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1.5rem';
        div.innerHTML = `
            <div style="font-size:1.25rem; font-weight:600; margin-bottom:0.5rem;">📁 ${escapeHtml(pName)}</div>
            <div style="color:var(--text-muted); margin-bottom:1rem;">${p.completed}/${p.count} tasks done</div>
            <div style="background:rgba(255,255,255,0.1); height:6px; border-radius:3px;">
                <div style="background:var(--primary); width:${percent}%; height:100%; border-radius:3px;"></div>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderHabits() {
    const completedCount = allTasks.filter(t => t.status === 'DONE').length;
    const score = completedCount * 10;
    document.getElementById('karma-display').textContent = score;
}

async function renderTeam() {
    const list = document.getElementById('team-list');
    list.innerHTML = '<div style="color:var(--text-muted);">Loading team...</div>';

    try {
        const res = await fetch('/api/users');
        const allUsers = await res.json();

        list.innerHTML = '';
        allUsers.forEach(u => {
            const div = document.createElement('div');
            div.style.display = 'flex'; div.style.alignItems = 'center';
            div.style.gap = '1rem'; div.style.padding = '1rem';
            div.style.background = 'rgba(255,255,255,0.05)';
            div.style.borderRadius = '0.5rem';

            div.innerHTML = `
                 <div class="avatar-placeholder"><i class='bx bxs-user'></i></div>
                 <div>
                     <div style="font-weight: 600;">${escapeHtml(u)}</div>
                     <div style="font-size: 0.875rem; color: var(--text-muted);">${u === currentUser ? 'You (Online)' : 'Team Member'}</div>
                 </div>
            `;
            list.appendChild(div);
        });

    } catch (e) {
        list.innerHTML = '<div style="color:#ef4444;">Failed to load team members.</div>';
    }
}

function renderListView() {
    const tbody = document.getElementById('task-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    allTasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => openTaskDetails(task.id);
        tr.innerHTML = `
            <td>${escapeHtml(task.title)}</td>
            <td><span class="badge">${task.status}</span></td>
            <td>${task.priority}</td>
            <td>${formatDate(task.dueDate)}</td>
            <td>${escapeHtml(task.assignedTo)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAnalytics() {
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    const ctxPriority = document.getElementById('priorityChart').getContext('2d');

    const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };

    allTasks.forEach(t => {
        if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
        if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
    });

    if (charts.status) charts.status.destroy();
    if (charts.priority) charts.priority.destroy();

    charts.status = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['To Do', 'In Progress', 'Done'],
            datasets: [{
                data: [statusCounts.TODO, statusCounts.IN_PROGRESS, statusCounts.DONE],
                backgroundColor: ['#94a3b8', '#6366f1', '#10b981'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }
    });

    charts.priority = new Chart(ctxPriority, {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High'],
            datasets: [{
                label: 'Tasks',
                data: [priorityCounts.LOW, priorityCounts.MEDIUM, priorityCounts.HIGH],
                backgroundColor: ['#3b82f6', '#eab308', '#ef4444'],
                barThickness: 40
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: 'white' }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

/* --- Logic --- */

function createTaskCard(task) {
    const div = document.createElement('div');
    div.className = 'glass-panel task-card';
    div.id = `task-${task.id}`;
    div.draggable = true;
    div.ondragstart = drag;
    div.dataset.id = task.id;
    div.onclick = (e) => {
        if (e.target.tagName !== 'BUTTON') openTaskDetails(task.id);
    };

    let priorityColor = '#94a3b8';
    if (task.priority === 'HIGH') priorityColor = '#ef4444';
    if (task.priority === 'MEDIUM') priorityColor = '#eab308';
    if (task.priority === 'LOW') priorityColor = '#3b82f6';

    const subtaskCount = task.subtasks ? task.subtasks.length : 0;
    const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
    const progressText = subtaskCount > 0 ? `${completedSubtasks}/${subtaskCount}` : '';

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start;">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <span class="badge" style="color: ${priorityColor}; border: 1px solid ${priorityColor}; font-size: 0.65rem;">${task.priority}</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">📂 ${escapeHtml(task.project || 'Inbox')}</div>
        <p class="task-desc">${escapeHtml(task.description || '')}</p>
        <div class="task-meta">
            <div>
                 ${task.dueDate ? `<span>📅 ${formatDate(task.dueDate)}</span>` : ''}
                 ${progressText ? `<span style="margin-left:8px;">☑️ ${progressText}</span>` : ''}
            </div>
            <button onclick="deleteTask('${task.id}')" style="color: #ef4444; background: none; padding: 4px;">Del</button>
        </div>
    `;
    return div;
}

function updateCounts() {
    ['TODO', 'IN_PROGRESS', 'DONE'].forEach(status => {
        const count = allTasks.filter(t => t.status === status).length;
        document.getElementById(`count-${status.toLowerCase().replace('_', '')}`).textContent = count;
    });
}

/* --- Task Details Modal --- */
function openTaskDetails(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    currentDetailTaskId = taskId;

    // Basic Fields
    document.getElementById('detail-title').textContent = task.title;
    document.getElementById('detail-desc').textContent = task.description || 'No description provided.';

    // Dependencies Render
    const depSelect = document.getElementById('dependency-select');
    depSelect.innerHTML = '<option value="">Select a task that blocks this one...</option>';
    allTasks.forEach(t => {
        if (t.id !== task.id) {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.title;
            depSelect.appendChild(opt);
        }
    });

    const depContainer = document.getElementById('detail-dependencies');
    depContainer.innerHTML = '';
    if (task.dependencyIds) {
        task.dependencyIds.forEach(depId => {
            const depTask = allTasks.find(t => t.id === depId);
            if (depTask) {
                const tag = document.createElement('span');
                tag.className = 'badge';
                tag.style.background = '#ef4444';
                tag.style.display = 'flex'; tag.style.alignItems = 'center'; tag.style.gap = '0.5rem';
                tag.innerHTML = `
                    <i class='bx bxs-lock-alt'></i> ${escapeHtml(depTask.title)}
                    <i class='bx bx-x' style="cursor:pointer;" onclick="removeDependency('${depId}')"></i>
                `;
                depContainer.appendChild(tag);
            }
        });
    }

    // Render subtasks
    const subContainer = document.getElementById('detail-subtasks');
    subContainer.innerHTML = '';
    if (task.subtasks) {
        task.subtasks.forEach((st, index) => {
            const div = document.createElement('div');
            div.style.display = 'flex'; div.style.alignItems = 'center'; div.style.gap = '0.5rem';
            div.innerHTML = `
                <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="toggleSubTask(${index})">
                <span style="${st.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${escapeHtml(st.title)}</span>
            `;
            subContainer.appendChild(div);
        });
    }

    // Render comments
    const comContainer = document.getElementById('detail-comments');
    comContainer.innerHTML = '';
    if (task.comments) {
        task.comments.forEach(c => {
            const div = document.createElement('div');
            div.className = 'glass-panel';
            div.style.padding = '0.75rem'; div.style.background = 'rgba(255,255,255,0.03)';
            div.innerHTML = `
                 <div style="font-size:0.75rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                    ${escapeHtml(c.author)} <span>${new Date(c.createdAt).toLocaleString()}</span>
                 </div>
                 <p style="margin-top:0.25rem;">${escapeHtml(c.content)}</p>
            `;
            comContainer.appendChild(div);
        });
    }

    document.getElementById('view-task-modal').style.display = 'flex';
}

/* --- Dependencies Logic --- */
async function addDependency() {
    const select = document.getElementById('dependency-select');
    const targetId = select.value;
    if (!targetId || !currentDetailTaskId) return;

    const task = allTasks.find(t => t.id === currentDetailTaskId);
    if (!task.dependencyIds) task.dependencyIds = [];
    if (!task.dependencyIds.includes(targetId)) {
        task.dependencyIds.push(targetId);
        await updateTaskRemote(task);
    }
    select.value = "";
}

async function removeDependency(depId) {
    const task = allTasks.find(t => t.id === currentDetailTaskId);
    if (task && task.dependencyIds) {
        task.dependencyIds = task.dependencyIds.filter(id => id !== depId);
        await updateTaskRemote(task);
    }
}


/* --- Subtask & Comments --- */
async function addSubTask() {
    const input = document.getElementById('new-subtask-input');
    const title = input.value.trim();
    if (!title || !currentDetailTaskId) return;

    const task = allTasks.find(t => t.id === currentDetailTaskId);
    if (!task) return;

    // We modify local object then PUT
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({ title: title, completed: false });

    await updateTaskRemote(task);
    input.value = '';
}

async function toggleSubTask(index) {
    const task = allTasks.find(t => t.id === currentDetailTaskId);
    if (!task || !task.subtasks[index]) return;

    task.subtasks[index].completed = !task.subtasks[index].completed;
    await updateTaskRemote(task);
}

async function addComment() {
    const input = document.getElementById('new-comment-input');
    const content = input.value.trim();
    if (!content || !currentDetailTaskId) return;

    const comment = { author: currentUser, content: content };
    // Use the specific endpoint
    try {
        await fetch(`/api/tasks/${currentDetailTaskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comment)
        });
        input.value = '';
    } catch (e) { console.error(e); }
}

async function updateTaskRemote(task) {
    try {
        await fetch(`/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
    } catch (e) { console.error(e); }
}

/* --- Updates --- */
function handleTaskUpdate(updatedTask) {
    const idx = allTasks.findIndex(t => t.id === updatedTask.id);
    if (idx > -1) allTasks[idx] = updatedTask;
    else allTasks.push(updatedTask);

    renderAllViews();

    // If details modal is open for this task, re-render it
    if (currentDetailTaskId === updatedTask.id) {
        openTaskDetails(updatedTask.id);
    }
}

function handleTaskDelete(taskId) {
    allTasks = allTasks.filter(t => t.id !== taskId);
    renderAllViews();
    if (currentDetailTaskId === taskId) closeViewTaskModal();
}

/* --- VIEW MODES (Kanban vs List) --- */
let currentViewMode = 'kanban';

function setViewMode(mode) {
    currentViewMode = mode;

    // Toggle Buttons
    const btnKanban = document.getElementById('btn-view-kanban');
    const btnList = document.getElementById('btn-view-list');

    if (mode === 'kanban') {
        btnKanban.style.background = 'var(--primary)';
        btnKanban.style.color = 'white';
        btnList.style.background = 'transparent';
        btnList.style.color = '#000000'; // Pure black specific

        document.getElementById('view-kanban').style.display = 'block';
        document.getElementById('view-list').style.display = 'none';

    } else {
        btnList.style.background = 'var(--primary)';
        btnList.style.color = 'white';
        btnKanban.style.background = 'transparent';
        btnKanban.style.color = '#000000';

        document.getElementById('view-kanban').style.display = 'none';
        document.getElementById('view-list').style.display = 'block';
        renderTaskTable();
    }
}

function renderTaskTable() {
    const tbody = document.getElementById('task-table-body');
    tbody.innerHTML = '';

    // Sort by Due Date (Standard Feature)
    const sortedTasks = [...allTasks].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    sortedTasks.forEach(task => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--glass-border)';
        tr.style.cursor = 'pointer';
        tr.onclick = () => openTaskDetails(task.id); // Changed to openTaskDetails

        // Priority Color
        let pColor = '#10b981';
        if (task.priority === 'MEDIUM') pColor = '#f59e0b';
        if (task.priority === 'HIGH') pColor = '#ef4444';

        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-';

        tr.innerHTML = `
            <td style="padding:1rem; font-weight:800; color:#000000;">${task.title}</td>
            <td style="padding:1rem;"><span class="badge" style="background:${pColor}20; color:${pColor};">${task.priority}</span></td>
            <td style="padding:1rem;"><span class="badge">${task.status.replace('_', ' ')}</span></td>
            <td style="padding:1rem; font-weight:800;">${dueDate}</td>
             <td style="padding:1rem;">${task.assignedTo || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* --- DRAG AND DROP (Kanban) --- */
function drag(ev) { ev.dataTransfer.setData("text", ev.target.dataset.id); ev.target.classList.add('dragging'); }
function allowDrop(ev) { ev.preventDefault(); ev.target.closest('.task-list')?.classList.add('drag-over'); }
async function drop(ev) {
    ev.preventDefault();
    document.querySelectorAll('.task-list').forEach(l => l.classList.remove('drag-over'));
    const list = ev.target.closest('.task-list');
    if (!list) return;

    const taskId = ev.dataTransfer.getData("text");
    const newStatus = list.dataset.status;

    const task = allTasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        // Validation: Blocked By Dependencies if moving to DONE
        if (newStatus === 'DONE' && task.dependencyIds && task.dependencyIds.length > 0) {
            const incompleteDeps = task.dependencyIds.filter(depId => {
                const dep = allTasks.find(t => t.id === depId);
                return dep && dep.status !== 'DONE';
            });

            if (incompleteDeps.length > 0) {
                showNotification(`Cannot move to Done! Blocked by: ${incompleteDeps.length} task(s).`, 'error');
                document.getElementById(`task-${taskId}`).classList.remove('dragging');
                return; // Cancel drop
            }
        }

        task.status = newStatus;
        await updateTaskRemote(task);
    }

    const card = document.getElementById(`task-${taskId}`);
    if (card) card.classList.remove('dragging');
}
document.addEventListener("dragend", (e) => e.target.classList.remove("dragging"));


/* --- Utils --- */
function closeViewTaskModal() {
    document.getElementById('view-task-modal').style.display = 'none';
    currentDetailTaskId = null;
}
function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
}
function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/* --- Settings Logic --- */

const translations = {
    en: {
        nav_tasks: "Tasks",
        nav_projects: "Projects",
        nav_habits: "Habits",
        nav_team: "Team",
        nav_analytics: "Analytics",
        nav_settings: "Settings",
        page_title: "My Tasks",
        page_subtitle: "Manage code, tasks, and projects.",
        btn_new_task: "New Task",
        col_todo: "To Do",
        col_inprogress: "In Progress",
        col_done: "Done"
    },
    es: {
        nav_tasks: "Tareas",
        nav_projects: "Proyectos",
        nav_habits: "Hábitos",
        nav_team: "Equipo",
        nav_analytics: "Analítica",
        nav_settings: "Ajustes",
        page_title: "Mis Tareas",
        page_subtitle: "Administra código, tareas y proyectos.",
        btn_new_task: "Nueva Tarea",
        col_todo: "Por Hacer",
        col_inprogress: "En Progreso",
        col_done: "Hecho"
    },
    de: {
        nav_tasks: "Aufgaben",
        nav_projects: "Projekte",
        nav_habits: "Gewohnheiten",
        nav_team: "Team",
        nav_analytics: "Analytik",
        nav_settings: "Einstellungen",
        page_title: "Meine Aufgaben",
        page_subtitle: "Verwalten Sie Code, Aufgaben und Projekte.",
        btn_new_task: "Neue Aufgabe",
        col_todo: "Zu tun",
        col_inprogress: "In Bearbeitung",
        col_done: "Erledigt"
    },
    ta: {
        nav_tasks: "பணிகள்",
        nav_projects: "திட்டங்கள்",
        nav_habits: "பழக்கவழக்கங்கள்",
        nav_team: "குழு",
        nav_analytics: "பகுப்பாய்வு",
        nav_settings: "அமைப்புகள்",
        page_title: "என் பணிகள்",
        page_subtitle: "குறியீடு, பணிகள் மற்றும் திட்டங்களை நிர்வகிக்கவும்.",
        btn_new_task: "புதிய பணி",
        col_todo: "செய்ய வேண்டியவை",
        col_inprogress: "செயலில் உள்ளது",
        col_done: "முடிந்தது"
    },
    hi: {
        nav_tasks: "कार्य",
        nav_projects: "परियोजनाएं",
        nav_habits: "आदतें",
        nav_team: "टीम",
        nav_analytics: "विश्लेषण",
        nav_settings: "सेटिंग्स",
        page_title: "मेरे कार्य",
        page_subtitle: "कोड, कार्य और परियोजनाओं का प्रबंधन करें।",
        btn_new_task: "नया कार्य",
        col_todo: "करने के लिए",
        col_inprogress: "प्रगति में",
        col_done: "पूर्ण"
    },
    zh: {
        nav_tasks: "任务",
        nav_projects: "项目",
        nav_habits: "习惯",
        nav_team: "团队",
        nav_analytics: "分析",
        nav_settings: "设置",
        page_title: "我的任务",
        page_subtitle: "管理代码、任务和项目。",
        btn_new_task: "新任务",
        col_todo: "待办",
        col_inprogress: "进行中",
        col_done: "已完成"
    }
};

function updateLanguage(lang) {
    const t = translations[lang] || translations['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
}

const Settings = {
    defaults: {
        priority: 'MEDIUM',
        language: 'en',
        fontSize: '1',
        primaryColor: '#6366f1',
        notificationAssignment: true,
        twoFactor: false,
        email: 'user@example.com',
        designation: '',
        notifTaskAssign: true,
        notifDueDate: true,
        notifEmailSummary: false
    },
    load: function () {
        const saved = JSON.parse(localStorage.getItem('taskflow_settings') || '{}');
        return { ...this.defaults, ...saved };
    },
    save: async function (newSettings) {
        const current = this.load();
        const merged = { ...current, ...newSettings };

        // Save to LocalStorage (Fallback/Cache)
        localStorage.setItem('taskflow_settings', JSON.stringify(merged));

        // Save to Backend (Source of Truth)
        try {
            await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    theme: merged.theme, // We need to track theme inside settings object now
                    language: merged.language,
                    primaryColor: merged.primaryColor
                    // Add other preferences here if backend supports them
                })
            });
        } catch (e) { console.error("Sync failed"); }
    }
};

function switchSettingTab(tabName) {
    document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById(`nav-item-${tabName}`);
    if (navItem) navItem.classList.add('active');

    document.querySelectorAll('.settings-section-view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`setting-${tabName}`);
    if (target) target.classList.add('active');
}

/* Account Actions */
async function saveProfile() {
    // specific user updates (username is immutable for now)
    const email = document.getElementById('setting-email').value;
    const designation = document.getElementById('setting-designation').value;

    try {
        const res = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, designation })
        });

        if (res.ok) {
            Settings.save({ email, designation });
            showNotification(`Success! Profile updated.`);
        } else {
            showNotification("Failed to update profile", 'error');
        }
    } catch (e) {
        showNotification("Error updating profile", 'error');
    }
}

function deleteAccount() {
    if (confirm("DANGER: Are you sure you want to delete your account? This application will reset.")) {
        showNotification("Account reset.", 'info');
        localStorage.clear();
        window.location.reload();
    }
}

/* Appearance */
function updateAppearance() {
    const fontSize = document.getElementById('setting-fontsize').value;
    const color = document.getElementById('setting-primarycolor').value;

    document.documentElement.style.setProperty('--font-scale', fontSize);
    document.body.style.fontSize = `${fontSize}rem`;

    document.documentElement.style.setProperty('--primary', color);

    Settings.save({ fontSize, primaryColor: color });
    showNotification("Appearance saved.");
}

/* Preferences */
function savePreferences() {
    const priority = document.getElementById('pref-default-priority').value;
    const language = document.getElementById('pref-language').value;

    Settings.save({
        priority,
        language
    });

    if (language !== Settings.load().language) {
        updateLanguage(language);
        showNotification(`Language changed to ${language.toUpperCase()}.`, 'info');
    } else {
        updateLanguage(language);
        showNotification("Preferences saved.");
    }
}

function saveNotifications() {
    const assign = document.getElementById('notif-task-assign').checked;
    const due = document.getElementById('notif-due-date').checked;
    const summary = document.getElementById('notif-email-summary').checked;

    Settings.save({
        notifTaskAssign: assign,
        notifDueDate: due,
        notifEmailSummary: summary
    });
    showNotification("Notification preferences saved.");
}

/* Security */
function toggle2FA() {
    const current = Settings.load().twoFactor;
    const newState = !current;
    Settings.save({ twoFactor: newState });
    render2FAState(newState);
}

function render2FAState(isEnabled) {
    const status = document.getElementById('2fa-status');
    const btn = document.getElementById('btn-2fa');
    if (isEnabled) {
        status.textContent = "Status: Enabled 🟢";
        btn.textContent = "Disable";
        btn.classList.replace('btn-primary', 'btn-danger'); // if btn-danger existed
        btn.style.background = '#ef4444';
    } else {
        status.textContent = "Status: Disabled";
        btn.textContent = "Enable";
        btn.style.background = 'var(--primary)';
    }
}

function changePasswordMock() {
    const current = prompt("Enter current password:");
    if (current) {
        const newPass = prompt("Enter new password:");
        if (newPass) {
            showNotification("Success: Password changed successfully!");
        }
    }
}

function logoutOtherSessions() {
    if (confirm("Are you sure you want to log out all other active sessions?")) {
        setTimeout(() => {
            showNotification("Success: All other sessions have been logged out.");
        }, 500);
    }
}

/* Data Actions */
async function clearCompletedTasks() {
    if (!confirm("Delete ALL completed tasks? This cannot be undone.")) return;

    const completed = allTasks.filter(t => t.status === 'DONE');
    let count = 0;
    for (const t of completed) {
        try {
            await fetch(`/api/tasks/${t.id}`, { method: 'DELETE' });
            count++;
        } catch (e) { console.error(e); }
    }
    await fetchAndRenderTasks();
    showNotification(`Deleted ${count} completed tasks.`);
}

function importData() {
    const input = document.getElementById('import-file');
    const file = input.files[0];
    if (!file) { showNotification("Please select a JSON file.", 'error'); return; }

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) throw new Error("Invalid format");

            let count = 0;
            for (const t of data) {
                const { id, ...newTask } = t;
                newTask.title = "[Import] " + newTask.title;
                await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newTask)
                });
                count++;
            }
            await fetchAndRenderTasks();
            showNotification(`Successfully imported ${count} tasks.`);
        } catch (err) {
            showNotification("Error importing: " + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

/* Init All Settings */
/* Init All Settings */
(async function initSettings() {
    let s = Settings.load();

    // 1. Fetch Cloud Profile First
    try {
        const res = await fetch('/api/users/profile');
        if (res.ok) {
            const profile = await res.json();
            // Merge cloud profile into settings
            if (profile.language) s.language = profile.language;
            if (profile.primaryColor) s.primaryColor = profile.primaryColor;
            if (profile.theme) s.theme = profile.theme; // We associate 'theme' with profile now

            // Explicit Fields
            if (profile.email) s.email = profile.email;
            if (profile.designation) s.designation = profile.designation;

            // Save merged back to local to keep it in sync
            localStorage.setItem('taskflow_settings', JSON.stringify(s));

            // APPLY IMMEDIATELY
            if (profile.theme) setTheme(profile.theme);
        }
    } catch (e) { console.log('Offline or Auth fail'); }

    // 2. Apply Settings onto UI

    // Theme logic handled by setTheme above or fallback below
    if (!document.body.getAttribute('data-theme')) {
        const savedTheme = s.theme || localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
    }

    const savedDensity = localStorage.getItem('density');
    if (savedDensity === 'compact') {
        document.body.classList.add('compact-mode');
        const toggle = document.getElementById('density-toggle');
        if (toggle) toggle.checked = true;
    }

    if (document.getElementById('setting-fontsize')) document.getElementById('setting-fontsize').value = s.fontSize || '1';

    // Primary Color
    if (document.getElementById('setting-primarycolor')) document.getElementById('setting-primarycolor').value = s.primaryColor || '#6366f1';
    if (s.primaryColor) document.documentElement.style.setProperty('--primary', s.primaryColor);

    if (s.fontSize) {
        document.documentElement.style.setProperty('--font-scale', s.fontSize);
        document.body.style.fontSize = `${s.fontSize}rem`;
    }

    if (document.getElementById('pref-default-priority')) document.getElementById('pref-default-priority').value = s.priority;
    if (document.getElementById('pref-language')) {
        document.getElementById('pref-language').value = s.language;
        updateLanguage(s.language);
    }

    if (document.getElementById('setting-email')) document.getElementById('setting-email').value = s.email || 'user@example.com';
    if (document.getElementById('setting-designation')) document.getElementById('setting-designation').value = s.designation || '';

    if (document.getElementById('notif-task-assign')) document.getElementById('notif-task-assign').checked = s.notifTaskAssign;
    if (document.getElementById('notif-due-date')) document.getElementById('notif-due-date').checked = s.notifDueDate;
    if (document.getElementById('notif-email-summary')) document.getElementById('notif-email-summary').checked = s.notifEmailSummary;

    if (document.getElementById('2fa-status')) render2FAState(s.twoFactor);

})();

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    // localStorage.setItem('theme', theme); // Redundant if using Settings.save
    Settings.save({ theme: theme });
}

function toggleDensity() {
    const toggle = document.getElementById('density-toggle');
    if (toggle.checked) {
        document.body.classList.add('compact-mode');
        localStorage.setItem('density', 'compact');
    } else {
        document.body.classList.remove('compact-mode');
        localStorage.setItem('density', 'comfortable');
    }
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allTasks, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "taskflow_backup_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/* --- Navigation Logic --- */
function switchView(viewName) {
    // 1. Hide ALL possible main sections
    const allSections = [
        'view-kanban', 'view-list', // Task Modes
        'view-projects', 'view-habits', 'view-team', // Main Views
        'view-analytics', 'view-settings'
    ];

    allSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // 2. Reset Nav Styles
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // 3. Header Visibility
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) {
        if (viewName === 'kanban' || viewName === 'list') {
            mainHeader.style.display = 'flex';
        } else {
            mainHeader.style.display = 'none';
        }
    }

    // 4. Logic for "Tasks"
    if (viewName === 'kanban' || viewName === 'list') {
        const navTasks = document.querySelector('.nav-item[onclick*="switchView(\'kanban\')"]');
        if (navTasks) navTasks.classList.add('active'); // Highlight "Tasks" sidebar item

        // Show correct mode
        if (currentViewMode === 'kanban') {
            document.getElementById('view-kanban').style.display = 'block';
        } else {
            document.getElementById('view-list').style.display = 'block';
            renderTaskTable(); // Safety refresh
        }

        // View Toggles sync
        const btnKanban = document.getElementById('btn-view-kanban');
        const btnList = document.getElementById('btn-view-list');
        if (btnKanban) {
            btnKanban.style.background = currentViewMode === 'kanban' ? 'var(--primary)' : 'transparent';
            btnKanban.style.color = currentViewMode === 'kanban' ? 'white' : '#000000';
        }
        if (btnList) {
            btnList.style.background = currentViewMode === 'list' ? 'var(--primary)' : 'transparent';
            btnList.style.color = currentViewMode === 'list' ? 'white' : '#000000';
        }

    }
    else {
        // 5. Standard Views
        const targetId = 'view-' + viewName;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            targetEl.style.display = 'block';

            // Highlight specific nav item
            const activeNav = document.querySelector(`.nav-item[onclick*="'${viewName}'"]`);
            if (activeNav) activeNav.classList.add('active');

            // Render triggers (Safe)
            try {
                if (viewName === 'projects') renderProjects();
                if (viewName === 'habits') renderHabits();
                if (viewName === 'team') renderTeam();
                if (viewName === 'analytics') renderAnalytics();
            } catch (e) {
                console.error(`Error rendering view ${viewName}:`, e);
            }
        } else {
            console.warn(`Target view element not found: view-${viewName}`);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    if (currentUser) {
        document.getElementById('username-display').textContent = currentUser;
        connectWebSocket();
        await fetchAndRenderTasks();

        // --- FORCE INITIAL VIEW ---
        switchView('kanban');
    }
});

/* --- Modal Logic (Create) --- */
async function showCreateTaskModal() {
    const modal = document.getElementById('create-task-modal');
    const assignSelect = document.getElementById('task-assign');
    assignSelect.innerHTML = '<option>Loading...</option>';

    document.getElementById('task-template').value = "";
    document.getElementById('task-project').value = "Inbox";

    const prefs = Settings.load();
    if (prefs.priority) document.getElementById('task-priority').value = prefs.priority;

    // Fetch users for assignment from backend
    try {
        const res = await fetch('/api/users');
        const users = await res.json();

        assignSelect.innerHTML = '';
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u; opt.textContent = u;
            if (u === currentUser) opt.selected = true;
            assignSelect.appendChild(opt);
        });

    } catch (e) {
        assignSelect.innerHTML = `<option value="${currentUser}">${currentUser}</option>`;
    }

    modal.style.display = 'flex';
}

function applyTemplate() {
    const template = document.getElementById('task-template').value;
    const titleObj = document.getElementById('task-title');
    const descObj = document.getElementById('task-desc');

    if (template === 'bug') {
        titleObj.value = "Bug: ";
        descObj.value = "**Steps to reproduce:**\n1. \n2. \n\n**Expected:** \n**Actual:** ";
    } else if (template === 'feature') {
        titleObj.value = "Feature: ";
        descObj.value = "**User Story:** As a user, I want... so that...\n\n**Acceptance Criteria:**\n- ";
    } else if (template === 'meeting') {
        titleObj.value = "Meeting: ";
        descObj.value = "**Agenda:**\n- \n- \n\n**Attendees:** ";
    }
}

function closeCreateTaskModal() {
    document.getElementById('create-task-modal').style.display = 'none';
}

async function handleCreateTask(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-duedate').value;
    const project = document.getElementById('task-project').value;
    const assignedTo = document.getElementById('task-assign').value;

    const newTask = {
        title: title,
        description: desc,
        status: 'TODO',
        priority: priority,
        project: project,
        assignedTo: assignedTo,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null
    };

    try {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });

        if (res.ok) {
            closeCreateTaskModal();
            // Stomp will handle update
            showNotification(`Task "${title}" created!`);
        }
    } catch (err) {
        console.error(err);
        showNotification("Failed to create task", "error");
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    showNotification('Task deleted');
}

// End of scripts
