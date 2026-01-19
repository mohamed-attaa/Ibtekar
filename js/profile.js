class ProfileManager {
    constructor() {
        this.currentTab = 'overview';
        this.userData = null;
        this.init();
    }
    
    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        this.loadTabContent();
        this.setupAvatarUpload();
    }
    
    async loadUserData() {
        try {
            // تحميل بيانات المستخدم من API
            this.userData = await api.getUserProfile();
            this.updateProfileUI();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.loadSampleData();
        }
    }
    
    loadSampleData() {
        // بيانات افتراضية للعرض
        this.userData = {
            id: 1,
            fullName: "محمد أحمد",
            email: "mohamed@example.com",
            phone: "0501234567",
            location: "الرياض، السعودية",
            joinDate: "يناير 2024",
            title: "طالب - مطور ويب",
            bio: "مطور ويب بخبرة 5 سنوات في تطوير التطبيقات والمواقع الإلكترونية.",
            skills: ["HTML/CSS", "JavaScript", "React", "Node.js", "Python", "SQL", "Git", "Docker"],
            languages: [
                { name: "العربية", level: 100, label: "اللغة الأم" },
                { name: "الإنجليزية", level: 80, label: "متقدم" }
            ],
            stats: {
                courses: 5,
                studyHours: 120,
                certificates: 3,
                avgRating: 4.8
            }
        };
        
        this.updateProfileUI();
    }
    
    updateProfileUI() {
        // تحديث معلومات رأس الملف
        document.getElementById('userName').textContent = this.userData.fullName;
        document.getElementById('userEmail').textContent = this.userData.email;
        document.getElementById('userPhone').textContent = this.userData.phone;
        document.getElementById('userLocation').textContent = this.userData.location;
        document.getElementById('joinDate').textContent = `منذ ${this.userData.joinDate}`;
        document.getElementById('userTitle').textContent = this.userData.title;
        
        // تحديث الإحصائيات
        if (this.userData.stats) {
            document.getElementById('coursesCount').textContent = this.userData.stats.courses;
            document.getElementById('studyHours').textContent = this.userData.stats.studyHours;
            document.getElementById('certificatesCount').textContent = this.userData.stats.certificates;
            document.getElementById('avgRating').textContent = this.userData.stats.avgRating;
        }
        
        // تحديث السيرة الذاتية
        this.updateBioContent();
    }
    
    updateBioContent() {
        const bioContent = document.getElementById('bioContent');
        if (!bioContent || !this.userData.bio) return;
        
        let html = `<p>${this.userData.bio}</p>`;
        
        if (this.userData.skills && this.userData.skills.length > 0) {
            html += `<h3>المهارات التقنية:</h3>
                    <div class="skills-list">`;
            
            this.userData.skills.forEach(skill => {
                html += `<span class="skill-tag">${skill}</span>`;
            });
            
            html += `</div>`;
        }
        
        if (this.userData.languages && this.userData.languages.length > 0) {
            html += `<h3>اللغات:</h3>
                    <div class="languages-list">`;
            
            this.userData.languages.forEach(lang => {
                html += `
                    <div class="language-item">
                        <span>${lang.name}</span>
                        <div class="language-level">
                            <div class="level-bar" style="width: ${lang.level}%"></div>
                            <span>${lang.label}</span>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        bioContent.innerHTML = html;
    }
    
    setupEventListeners() {
        // علامات التبويب
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
        
        // زر تسجيل الخروج
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
    
    switchTab(tabName) {
        // تحديث علامات التبويب النشطة
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // إخفاء جميع محتويات التبويبات
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // إظهار محتوى التبويب المحدد
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        // تحميل محتوى التبويب إذا لزم الأمر
        this.loadTabContent(tabName);
    }
    
    async loadTabContent(tabName = 'overview') {
        switch (tabName) {
            case 'courses':
                await this.loadUserCourses();
                break;
            case 'achievements':
                await this.loadAchievements();
                break;
            case 'activity':
                await this.loadActivity();
                break;
        }
    }
    
    async loadUserCourses() {
        try {
            const courses = await api.getUserCourses();
            this.displayCourses(courses);
        } catch (error) {
            console.error('Error loading courses:', error);
            this.displaySampleCourses();
        }
    }
    
    displayCourses(courses) {
        const container = document.getElementById('userCoursesGrid');
        if (!container) return;
        
        let html = '';
        
        courses.forEach(course => {
            html += `
                <div class="course-card">
                    <div class="course-image">
                        <img src="${course.image || 'assets/images/course-placeholder.jpg'}" alt="${course.title}">
                        ${course.progress ? `
                            <div class="course-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                                </div>
                                <span class="progress-text">${course.progress}%</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="course-content">
                        <span class="course-category">${course.category}</span>
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-description">${course.description.substring(0, 100)}...</p>
                        <div class="course-meta">
                            <div class="course-instructor">
                                <img src="${course.instructorAvatar || 'assets/images/instructor-1.jpg'}" 
                                     alt="${course.instructor}" class="instructor-avatar">
                                <span>${course.instructor}</span>
                            </div>
                            <div class="course-action">
                                <a href="course.html?id=${course.id}" class="btn btn-outline btn-small">
                                    ${course.completed ? 'معاينة' : 'متابعة'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    displaySampleCourses() {
        const courses = [
            {
                id: 1,
                title: "دورة تطوير الويب المتكاملة",
                description: "تعلم تطوير مواقع الويب من الصفر إلى الاحتراف",
                category: "برمجة",
                instructor: "أحمد محمد",
                progress: 75,
                completed: false
            },
            {
                id: 2,
                title: "دورة React المتقدمة",
                description: "تطوير تطبيقات ويب باستخدام React و Redux",
                category: "برمجة",
                instructor: "سارة عبدالله",
                progress: 100,
                completed: true
            }
        ];
        
        this.displayCourses(courses);
    }
    
    async loadAchievements() {
        try {
            const achievements = await api.getUserAchievements();
            this.displayAchievements(achievements);
        } catch (error) {
            console.error('Error loading achievements:', error);
            this.displaySampleAchievements();
        }
    }
    
    displayAchievements(achievements) {
        const container = document.getElementById('achievementsGrid');
        if (!container) return;
        
        let html = '';
        
        achievements.forEach(achievement => {
            html += `
                <div class="achievement-card">
                    <div class="achievement-icon">
                        <i class="${achievement.icon}"></i>
                    </div>
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                    <div class="achievement-date">
                        <i class="fas fa-calendar"></i>
                        ${achievement.date}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    displaySampleAchievements() {
        const achievements = [
            {
                title: "متعلم نشط",
                description: "أكمل 100 ساعة دراسة",
                icon: "fas fa-graduation-cap",
                date: "يناير 2024"
            },
            {
                title: "طالب متفوق",
                description: "حصل على 5 شهادات مكتملة",
                icon: "fas fa-trophy",
                date: "ديسمبر 2023"
            }
        ];
        
        this.displayAchievements(achievements);
    }
    
    setupAvatarUpload() {
        const avatarInput = document.getElementById('avatarInput');
        const avatarImage = document.getElementById('avatarImage');
        
        if (avatarInput && avatarImage) {
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.uploadAvatar(file);
                }
            });
        }
    }
    
    async uploadAvatar(file) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            
            // إظهار مؤشر التحميل
            const avatarImage = document.getElementById('avatarImage');
            avatarImage.style.opacity = '0.5';
            
            // رفع الصورة إلى السيرفر
            const result = await api.uploadAvatar(formData);
            
            // تحديث الصورة المعروضة
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarImage.src = e.target.result;
                avatarImage.style.opacity = '1';
                ApiHelper.showNotification('تم تحديث صورة الملف بنجاح', 'success');
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Error uploading avatar:', error);
            ApiHelper.showNotification('فشل في تحديث الصورة', 'error');
            avatarImage.style.opacity = '1';
        }
    }
    
    async updateProfile(profileData) {
        try {
            // إظهار مؤشر التحميل
            ApiHelper.showNotification('جاري تحديث الملف...', 'info');
            
            // إرسال البيانات إلى السيرفر
            const result = await api.updateUserProfile(profileData);
            
            // تحديث البيانات المحلية
            this.userData = { ...this.userData, ...profileData };
            this.updateProfileUI();
            
            ApiHelper.showNotification('تم تحديث الملف بنجاح', 'success');
            return true;
            
        } catch (error) {
            console.error('Error updating profile:', error);
            ApiHelper.showNotification('فشل في تحديث الملف', 'error');
            return false;
        }
    }
    
    logout() {
        api.logout();
        window.location.href = 'login.html';
    }
}

// وظائف مساعدة للنوافذ المنبثقة
function openEditModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'block';
        loadEditForm();
    }
}

function closeEditModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadEditForm() {
    const modalBody = document.querySelector('#editProfileModal .modal-body');
    if (!modalBody) return;
    
    const profileManager = window.profileManager;
    
    modalBody.innerHTML = `
        <form id="editProfileForm" class="edit-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="editFirstName">الاسم الأول</label>
                    <input type="text" id="editFirstName" 
                           value="${profileManager.userData.fullName?.split(' ')[0] || ''}" required>
                </div>
                <div class="form-group">
                    <label for="editLastName">اسم العائلة</label>
                    <input type="text" id="editLastName" 
                           value="${profileManager.userData.fullName?.split(' ')[1] || ''}" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="editEmail">البريد الإلكتروني</label>
                <input type="email" id="editEmail" 
                       value="${profileManager.userData.email || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="editPhone">رقم الهاتف</label>
                <input type="tel" id="editPhone" 
                       value="${profileManager.userData.phone || ''}">
            </div>
            
            <div class="form-group">
                <label for="editLocation">الموقع</label>
                <input type="text" id="editLocation" 
                       value="${profileManager.userData.location || ''}">
            </div>
            
            <div class="form-group">
                <label for="editTitle">المسمى الوظيفي</label>
                <input type="text" id="editTitle" 
                       value="${profileManager.userData.title || ''}">
            </div>
            
            <div class="form-group">
                <label for="editBio">السيرة الذاتية</label>
                <textarea id="editBio" rows="4">${profileManager.userData.bio || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label for="editSkills">المهارات (افصل بينها بفواصل)</label>
                <input type="text" id="editSkills" 
                       value="${Array.isArray(profileManager.userData.skills) ? profileManager.userData.skills.join(', ') : ''}">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeEditModal()">إلغاء</button>
                <button type="submit" class="btn btn-primary">حفظ التغييرات</button>
            </div>
        </form>
    `;
    
    // إعداد حدث إرسال النموذج
    const form = document.getElementById('editProfileForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const profileData = {
                fullName: `${document.getElementById('editFirstName').value} ${document.getElementById('editLastName').value}`,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value,
                location: document.getElementById('editLocation').value,
                title: document.getElementById('editTitle').value,
                bio: document.getElementById('editBio').value,
                skills: document.getElementById('editSkills').value.split(',').map(s => s.trim()).filter(s => s)
            };
            
            const success = await profileManager.updateProfile(profileData);
            if (success) {
                closeEditModal();
            }
        });
    }
}

// تهيئة مدير الملف الشخصي عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
    
    // إغلاق النافذة المنبثقة عند النقر خارجها
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEditModal();
            }
        });
    }
});