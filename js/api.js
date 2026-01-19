const API_BASE_URL = 'https://api.eduplatform.com';

class EduPlatformAPI {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }
    
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // إضافة التوكن فقط إذا كان موجوداً (لا يتم إجباره)
        if (this.token && !endpoint.includes('/public/')) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const config = {
            ...options,
            headers
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                // إذا كان الخطأ 401 (غير مصرح)، نطلب من المستخدم تسجيل الدخول
                if (response.status === 401 && !endpoint.includes('/public/')) {
                    // لا نعيد التوجيه تلقائياً، فقط نلقي خطأ
                    throw new Error('يجب تسجيل الدخول للوصول لهذه الصفحة');
                }
                
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    // === API العامة (لا تحتاج تسجيل دخول) ===
    
    // الحصول على الدورات العامة
    async getPublicCourses(page = 1, limit = 10) {
        return this.request(`/api/public/courses?page=${page}&limit=${limit}`);
    }
    
    // الحصول على تفاصيل دورة عامة
    async getPublicCourse(courseId) {
        return this.request(`/api/public/courses/${courseId}`);
    }
    
    // الحصول على المدربين
    async getInstructors() {
        return this.request('/api/public/instructors');
    }
    
    // الحصول على الإحصائيات العامة
    async getPublicStats() {
        return this.request('/api/public/stats');
    }
    
    // إرسال رسالة اتصل بنا
    async contactUs(data) {
        return this.request('/api/public/contact', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // الاشتراك في النشرة البريدية
    async subscribeNewsletter(email) {
        return this.request('/api/public/newsletter/subscribe', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }
    
    // === API المحمية (تحتاج تسجيل دخول) ===
    
    // المصادقة
    async login(email, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }
    
    async register(userData) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    async logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userType');
        localStorage.removeItem('userName');
    }
    
    // الدورات المحمية
    async getCourses() {
        return this.request('/api/courses');
    }
    
    async getCourse(courseId) {
        return this.request(`/api/courses/${courseId}`);
    }
    
    async enrollInCourse(courseId) {
        return this.request(`/api/courses/${courseId}/enroll`, {
            method: 'POST'
        });
    }
    
    // الفيديوهات المحمية
    async getCourseVideos(courseId) {
        return this.request(`/api/courses/${courseId}/videos`);
    }
    
    async getVideoStream(videoId) {
        return this.request(`/api/videos/${videoId}/stream`);
    }
    
    // المستخدم
    async getUserProfile() {
        return this.request('/api/users/profile');
    }
    
    async updateUserProfile(userData) {
        return this.request('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }
    
    async getUserCourses() {
        return this.request('/api/users/courses');
    }
}

// إنشاء كائن API
const api = new EduPlatformAPI();

// دليل مساعد للاستخدام
class ApiHelper {
    
    // التحقق من حالة تسجيل الدخول (اختياري)
    static async initialize() {
        const token = localStorage.getItem('authToken');
        
        // تحديث التوكن في كائن API
        api.token = token;
        
        // إذا كان المستخدم مسجل الدخول، جلب بياناته (اختياري)
        if (token) {
            try {
                const user = await api.getUserProfile();
                window.currentUser = user;
                console.log('User is logged in:', user.name);
            } catch (error) {
                console.log('User token might be expired');
                // لا نقوم بأي شيء، نترك المستخدم يتصفح
            }
        }
        
        // لا نعيد توجيه أي شخص لأي مكان
        // يمكن للمستخدم تصفح الموقع بحرية
    }
    
    // التحقق من تسجيل الدخول
    static isLoggedIn() {
        const token = localStorage.getItem('authToken');
        return !!token;
    }
    
    // جلب بيانات المستخدم إذا كان مسجلاً
    static getUserData() {
        return {
            name: localStorage.getItem('userName'),
            email: localStorage.getItem('userEmail'),
            type: localStorage.getItem('userType'),
            id: localStorage.getItem('userId')
        };
    }
    
    // تسجيل الدخول
    static async login(email, password) {
        try {
            const response = await api.login(email, password);
            
            // حفظ البيانات
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userId', response.userId);
            localStorage.setItem('userType', response.userType);
            localStorage.setItem('userName', response.name || response.email);
            
            // تحديث التوكن في كائن API
            api.token = response.token;
            
            return { success: true, user: response };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    // تسجيل الخروج
    static logout() {
        api.logout();
        window.currentUser = null;
        api.token = null;
    }
    
    // عرض إشعار
    static showNotification(message, type = 'success') {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                  type === 'error' ? 'exclamation-circle' : 
                                  type === 'warning' ? 'exclamation-triangle' : 
                                  'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // إضافة الأنماط
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: ${type === 'success' ? '#d1fae5' :
                        type === 'error' ? '#fee2e2' :
                        type === 'warning' ? '#fef3c7' :
                        '#e0e7ff'};
            color: ${type === 'success' ? '#065f46' :
                    type === 'error' ? '#991b1b' :
                    type === 'warning' ? '#92400e' :
                    '#3730a3'};
            border: 1px solid ${type === 'success' ? '#a7f3d0' :
                              type === 'error' ? '#fecaca' :
                              type === 'warning' ? '#fde68a' :
                              '#c7d2fe'};
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            max-width: 400px;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        `;
        
        // زر الإغلاق
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(150%)';
            setTimeout(() => notification.remove(), 300);
        });
        
        // إضافة إلى الصفحة
        document.body.appendChild(notification);
        
        // إظهار الرسالة
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // إخفاء تلقائي بعد 5 ثواني
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(150%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        return notification;
    }
    
    // تنسيق التاريخ
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // تنسيق الوقت
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    // تنسيق المبلغ
    static formatCurrency(amount, currency = 'SAR') {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    // حماية الصفحات (اختياري - يمكن استدعاؤها يدوياً)
    static protectPage(allowedPaths = []) {
        const currentPath = window.location.pathname;
        
        // الصفحات المسموح بها للجميع
        const publicPages = [
            '/',
            '/index.html',
            '/login.html',
            '/register.html',
            '/forgot-password.html',
            '/courses.html',
            '/about.html',
            '/contact.html'
        ];
        
        // إذا كانت الصفحة عامة، لا نفعل شيء
        if (publicPages.includes(currentPath) || allowedPaths.includes(currentPath)) {
            return;
        }
        
        // إذا لم يكن المستخدم مسجلاً الدخول، نطلب منه التسجيل (بدون إعادة توجيه قسرية)
        if (!this.isLoggedIn()) {
            // يمكن عرض رسالة أو زر تسجيل دخول
            console.log('هذه الصفحة تحتاج تسجيل دخول');
            // لا نعيد التوجيه تلقائياً
        }
    }
    
    // توجيه المستخدم للصفحة المناسبة
    static redirectUser() {
        // هذه الوظيفة اختيارية ويمكن استدعاؤها يدوياً عند الحاجة
        const currentPath = window.location.pathname;
        const isLoggedIn = this.isLoggedIn();
        
        // إذا كان المستخدم مسجلاً الدخول وهو في صفحة تسجيل دخول أو تسجيل
        if (isLoggedIn && (currentPath.includes('login.html') || currentPath.includes('register.html'))) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        // إذا لم يكن مسجلاً وهو في صفحة محمية (اختياري)
        if (!isLoggedIn && currentPath.includes('dashboard.html')) {
            // يمكن عرض رسالة بدلاً من إعادة التوجيه
            console.log('يجب تسجيل الدخول للوصول للوحة التحكم');
            // نترك المستخدم يقرر
        }
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تهيئة بدون أي إعادة توجيه تلقائية
    ApiHelper.initialize();
    
    // يمكنك إضافة أي منطق إضافي هنا
    loadPublicContent();
});

// وظيفة لتحميل المحتوى العام
async function loadPublicContent() {
    try {
        // تحميل الدورات العامة
        const courses = await api.getPublicCourses();
        displayCourses(courses);
        
        // تحميل الإحصائيات العامة
        const stats = await api.getPublicStats();
        updateStats(stats);
        
    } catch (error) {
        console.log('يمكن عرض محتوى بديل هنا');
    }
}

// وظائف مساعدة للعرض
function displayCourses(courses) {
    // عرض الدورات في الصفحة
    const container = document.getElementById('coursesContainer');
    if (!container) return;
    
    let html = '';
    courses.forEach(course => {
        html += `
            <div class="course-card">
                <div class="course-image">
                    <img src="${course.image || 'default-course.jpg'}" alt="${course.title}">
                </div>
                <div class="course-content">
                    <span class="course-category">${course.category}</span>
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-description">${course.description.substring(0, 100)}...</p>
                    <div class="course-meta">
                        <div class="course-instructor">
                            <span>${course.instructor}</span>
                        </div>
                        <div class="course-price">${course.price} ر.س</div>
                    </div>
                    <a href="course.html?id=${course.id}" class="btn-view-course">عرض الدورة</a>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateStats(stats) {
    // تحديث الإحصائيات في الصفحة
    document.getElementById('totalStudents')?.textContent = stats.totalStudents || '0';
    document.getElementById('totalCourses')?.textContent = stats.totalCourses || '0';
    document.getElementById('totalInstructors')?.textContent = stats.totalInstructors || '0';
    document.getElementById('satisfactionRate')?.textContent = stats.satisfactionRate || '0';
}

// جعل الـ API متاحاً عالمياً
window.api = api;
window.ApiHelper = ApiHelper;