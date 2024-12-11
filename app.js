// 数据管理
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['未分类'];

// 添加标签相关的全局变量
let currentTags = new Set();
let allTags = new Set();

// 添加初始化标签集合的函数
function initAllTags() {
    allTags.clear();
    bookmarks.forEach(bookmark => {
        if (bookmark.tags && Array.isArray(bookmark.tags)) {
            bookmark.tags.forEach(tag => allTags.add(tag));
        }
    });
}

// 保存数据到localStorage
function saveData() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    localStorage.setItem('categories', JSON.stringify(categories));
}

// 显示/隐藏对话框
function showDialog(id) {
    const dialog = document.getElementById(id);
    dialog.style.display = 'block';
    
    // 添加点击外部关闭功能
    dialog.addEventListener('click', function(e) {
        if (e.target === dialog) {
            hideDialog(id);
        }
    });
}

function hideDialog(id) {
    const dialog = document.getElementById(id);
    dialog.style.display = 'none';
    
    // 移除事件监听器
    dialog.removeEventListener('click', function(e) {
        if (e.target === dialog) {
            hideDialog(id);
        }
    });
}

// 初始化标签输入处理
function initTagsInput() {
    const tagsInput = document.getElementById('bookmarkTags');
    const tagsPreview = document.getElementById('tagsPreview');
    
    tagsInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = this.value.trim().toLowerCase();
            if (tag && !currentTags.has(tag)) {
                currentTags.add(tag);
                renderTagsPreview();
                this.value = '';
            }
        }
    });
    
    // 清空当前标签
    currentTags.clear();
    renderTagsPreview();
}

// 渲染标签预览
function renderTagsPreview() {
    const tagsPreview = document.getElementById('tagsPreview');
    tagsPreview.innerHTML = '';
    
    currentTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <span class="remove-tag" onclick="removeTag('${tag}')">&times;</span>
        `;
        tagsPreview.appendChild(tagElement);
    });
}

// 移除标签
function removeTag(tag) {
    currentTags.delete(tag);
    renderTagsPreview();
}

// 添加新书签
function addBookmark(event) {
    event.preventDefault();
    
    const title = document.getElementById('bookmarkTitle').value;
    const url = document.getElementById('bookmarkUrl').value;
    const category = document.getElementById('bookmarkCategory').value;
    const description = document.getElementById('bookmarkDescription').value;
    const tags = Array.from(currentTags);
    
    const bookmark = {
        id: Date.now(),
        title,
        url,
        category,
        description,
        tags,
        createTime: new Date().toISOString()
    };
    
    bookmarks.push(bookmark);
    
    // 更新全局标签集合
    tags.forEach(tag => allTags.add(tag));
    
    saveData();
    hideDialog('addBookmarkDialog');
    updateFilterSelects();
    renderBookmarks();
    event.target.reset();
    currentTags.clear();
    renderTagsPreview();
}

// 删除书签
function deleteBookmark(id) {
    if (confirm('确定要删除这个书签吗？')) {
        // 删除书签前先获取其标签
        const bookmark = bookmarks.find(b => b.id === id);
        bookmarks = bookmarks.filter(b => b.id !== id);
        
        // 更新全局标签集合
        if (bookmark && bookmark.tags) {
            bookmark.tags.forEach(tag => {
                // 检查是否还有其他书签使用这个标签
                const tagStillInUse = bookmarks.some(b => 
                    b.tags && b.tags.includes(tag)
                );
                if (!tagStillInUse) {
                    allTags.delete(tag);
                }
            });
        }
        
        saveData();
        updateFilterSelects();
        renderBookmarks();
    }
}

// 添加分类
function addCategory() {
    const input = document.getElementById('newCategoryInput');
    const category = input.value.trim();
    
    if (category && !categories.includes(category)) {
        categories.push(category);
        saveData();
        renderCategories();
        updateFilterSelects();
        input.value = '';
    }
}

// 删除分类
function deleteCategory(category) {
    if (category === '未分类') {
        alert('不能删除默认分类！');
        return;
    }
    
    if (confirm(`确定要删除 "${category}" 分类吗？`)) {
        // 将该分类下的书签移到"未分类"
        bookmarks.forEach(bookmark => {
            if (bookmark.category === category) {
                bookmark.category = '未分类';
            }
        });
        
        categories = categories.filter(c => c !== category);
        saveData();
        renderCategories();
        renderBookmarks();
        updateFilterSelects();
    }
}

// 渲染书签列表
function renderBookmarks(filterCategory = 'all', filterTag = null) {
    const container = document.getElementById('bookmarkList');
    container.innerHTML = '';
    
    let filteredBookmarks = bookmarks;
    
    // 分类筛选
    if (filterCategory !== 'all') {
        filteredBookmarks = filteredBookmarks.filter(b => b.category === filterCategory);
    }
    
    // 标签筛选
    if (filterTag) {
        filteredBookmarks = filteredBookmarks.filter(b => b.tags && b.tags.includes(filterTag));
    }
    
    filteredBookmarks.forEach(bookmark => {
        const card = document.createElement('div');
        card.className = 'bookmark-card';
        
        // 创建标签HTML
        const tagsHtml = bookmark.tags && bookmark.tags.length > 0
            ? `<div class="bookmark-tags">
                ${bookmark.tags.map(tag => 
                    `<span class="bookmark-tag" onclick="filterByTag('${tag}')">${tag}</span>`
                ).join('')}
               </div>`
            : '';
        
        card.innerHTML = `
            <div class="bookmark-title">${bookmark.title}</div>
            <a href="${bookmark.url}" class="bookmark-url" target="_blank">${bookmark.url}</a>
            ${bookmark.description ? `<div class="bookmark-description">${bookmark.description}</div>` : ''}
            <div class="bookmark-category">${bookmark.category}</div>
            ${tagsHtml}
            <div class="bookmark-actions">
                <button onclick="deleteBookmark(${bookmark.id})">删除</button>
                <a href="${bookmark.url}" target="_blank">
                    <button>访问</button>
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}

// 渲染分类列表
function renderCategories() {
    const container = document.getElementById('categoryList');
    container.innerHTML = '';
    
    categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <span>${category}</span>
            <button onclick="deleteCategory('${category}')"
                    ${category === '未分类' ? 'disabled' : ''}>
                删除
            </button>
        `;
        container.appendChild(item);
    });
}

// 更新分类选择框
function updateFilterSelects() {
    // 更新分类选择框
    const categorySelect = document.getElementById('filterSelect');
    const bookmarkCategory = document.getElementById('bookmarkCategory');
    
    // 更新筛选器的分类选择框
    categorySelect.innerHTML = '<option value="all">全部</option>';
    categories.forEach(category => {
        categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
    });
    
    // 更新添加书签对话框的分类选择框
    bookmarkCategory.innerHTML = '';
    categories.forEach(category => {
        bookmarkCategory.innerHTML += `<option value="${category}">${category}</option>`;
    });
    
    // 更新标签选择框
    const tagSelect = document.getElementById('tagSelect');
    tagSelect.innerHTML = '<option value="all">全部</option>';
    
    // 将标签按字母顺序排序并添加到选择框
    Array.from(allTags)
        .sort((a, b) => a.localeCompare(b))
        .forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagSelect.appendChild(option);
        });
}

// 搜索功能
function searchBookmarks() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const container = document.getElementById('bookmarkList');
    container.innerHTML = '';
    
    const results = bookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(keyword) ||
        bookmark.url.toLowerCase().includes(keyword) ||
        bookmark.category.toLowerCase().includes(keyword) ||
        (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(keyword)))
    );
    
    results.forEach(bookmark => {
        // 使用与renderBookmarks相同的渲染逻辑
        const card = document.createElement('div');
        card.className = 'bookmark-card';
        
        const tagsHtml = bookmark.tags && bookmark.tags.length > 0
            ? `<div class="bookmark-tags">
                ${bookmark.tags.map(tag => 
                    `<span class="bookmark-tag" onclick="filterByTag('${tag}')">${tag}</span>`
                ).join('')}
               </div>`
            : '';
        
        card.innerHTML = `
            <div class="bookmark-title">${bookmark.title}</div>
            <a href="${bookmark.url}" class="bookmark-url" target="_blank">${bookmark.url}</a>
            ${bookmark.description ? `<div class="bookmark-description">${bookmark.description}</div>` : ''}
            <div class="bookmark-category">${bookmark.category}</div>
            ${tagsHtml}
            <div class="bookmark-actions">
                <button onclick="deleteBookmark(${bookmark.id})">删除</button>
                <a href="${bookmark.url}" target="_blank">
                    <button>访问</button>
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}

// 初始化
function init() {
    // 绑定事件监听器
    document.getElementById('addBookmarkForm').addEventListener('submit', addBookmark);
    
    // 初始化所有标签
    initAllTags();
    
    // 初始化界面
    updateFilterSelects();
    renderCategories();
    renderBookmarks();
    
    // 添加侧边栏初始化
    renderSidebarCategories();
    renderSidebarTags();
    
    // 添加移动端菜单切换功能
    if (window.innerWidth <= 768) {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '☰';
        menuToggle.onclick = toggleSidebar;
        document.body.appendChild(menuToggle);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 显示首页
function showHome() {
    hideDialog('addBookmarkDialog');
    hideDialog('categoryDialog');
    renderBookmarks();
}

// 显示添加书签对话框
function showAddBookmark() {
    showDialog('addBookmarkDialog');
    initTagsInput();
}

// 显示分类管理对话框
function showCategories() {
    renderCategories();
    showDialog('categoryDialog');
}

// 排序书签
function sortBookmarks() {
    const sortType = document.getElementById('sortSelect').value;
    let sortedBookmarks = [...bookmarks];
    
    if (sortType === 'time') {
        sortedBookmarks.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
    } else if (sortType === 'name') {
        sortedBookmarks.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    bookmarks = sortedBookmarks;
    renderBookmarks();
}

// 筛选书签
function filterBookmarks() {
    const category = document.getElementById('filterSelect').value;
    const tag = document.getElementById('tagSelect').value;
    renderBookmarks(category, tag === 'all' ? null : tag);
}

// 按标签筛选
function filterByTag(tag) {
    const tagSelect = document.getElementById('tagSelect');
    tagSelect.value = tag;
    filterBookmarks();
}

// 添加渲染侧边栏分类的函数
function renderSidebarCategories() {
    const container = document.getElementById('sidebarCategories');
    container.innerHTML = `
        <li>
            <a href="#" onclick="filterByCategory('all')">
                <i class="icon">📑</i>全部
            </a>
        </li>
    `;
    
    categories.forEach(category => {
        container.innerHTML += `
            <li>
                <a href="#" onclick="filterByCategory('${category}')">
                    <i class="icon">📁</i>${category}
                </a>
            </li>
        `;
    });
}

// 添加渲染侧边栏标签的函数
function renderSidebarTags() {
    const container = document.getElementById('sidebarTags');
    container.innerHTML = '';
    
    Array.from(allTags)
        .sort((a, b) => a.localeCompare(b))
        .forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'bookmark-tag';
            tagElement.onclick = () => filterByTag(tag);
            tagElement.textContent = tag;
            container.appendChild(tagElement);
        });
}

// 添加分类筛选函数
function filterByCategory(category) {
    document.getElementById('filterSelect').value = category;
    filterBookmarks();
}

// 添加移动端侧边栏切换功能
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('hidden'); // 切换隐藏类
    mainContent.classList.toggle('shifted'); // 切换主要内容区域的类
} 