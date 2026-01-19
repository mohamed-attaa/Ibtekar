class CheckoutManager {
    constructor() {
        this.courseData = null;
        this.paymentMethod = 'mada';
        this.billingType = 'same';
        this.couponApplied = false;
        this.couponDiscount = 0;
        this.init();
    }
    
    init() {
        this.loadCourseData();
        this.setupEventListeners();
        this.calculateTotals();
    }
    
    loadCourseData() {
        // تحميل بيانات الدورة من URL أو localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');
        
        if (courseId) {
            // تحميل بيانات الدورة من API
            this.fetchCourseData(courseId);
        } else {
            // استخدام بيانات افتراضية
            this.loadSampleData();
        }
    }
    
    async fetchCourseData(courseId) {
        try {
            this.courseData = await api.getCourse(courseId);
            this.updateCourseUI();
        } catch (error) {
            console.error('Error fetching course data:', error);
            this.loadSampleData();
        }
    }
    
    loadSampleData() {
        this.courseData = {
            id: 1,
            title: "دورة تطوير الويب المتكاملة",
            instructor: "أحمد محمد",
            originalPrice: 499,
            finalPrice: 299,
            discount: 200,
            duration: "30 ساعة",
            lessons: 50,
            hasCertificate: true
        };
        
        this.updateCourseUI();
    }
    
    updateCourseUI() {
        if (!this.courseData) return;
        
        document.getElementById('courseTitle').textContent = this.courseData.title;
        document.getElementById('courseInstructor').textContent = `مع المدرب: ${this.courseData.instructor}`;
        document.getElementById('coursePrice').textContent = `${this.courseData.finalPrice} ر.س`;
        
        // تحديث الأسعار في الفاتورة
        this.calculateTotals();
    }
    
    setupEventListeners() {
        // طرق الدفع
        document.querySelectorAll('.method-option').forEach(option => {
            option.addEventListener('click', () => this.selectPaymentMethod(option.dataset.method));
        });
        
        // معلومات الفاتورة
        document.querySelectorAll('.billing-option').forEach(option => {
            option.addEventListener('click', () => this.selectBillingType(option.dataset.type));
        });
        
        // تطبيق كود الخصم
        document.getElementById('applyCoupon').addEventListener('click', () => this.applyCoupon());
        document.getElementById('couponCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.applyCoupon();
            }
        });
        
        // تنسيق رقم البطاقة
        document.getElementById('cardNumber').addEventListener('input', (e) => {
            this.formatCardNumber(e.target);
        });
        
        // تنسيق تاريخ الانتهاء
        document.getElementById('expiryDate').addEventListener('input', (e) => {
            this.formatExpiryDate(e.target);
        });
        
        // إرسال نموذج الدفع
        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processPayment();
        });
    }
    
    selectPaymentMethod(method) {
        this.paymentMethod = method;
        
        // تحديث الواجهة
        document.querySelectorAll('.method-option').forEach(option => {
            option.classList.remove('active');
        });
        
        document.querySelector(`[data-method="${method}"]`).classList.add('active');
        
        // إظهار/إخفاء حقول مدى
        const madaFields = document.getElementById('madaFields');
        if (method === 'mada') {
            madaFields.style.display = 'block';
        } else {
            madaFields.style.display = 'none';
        }
    }
    
    selectBillingType(type) {
        this.billingType = type;
        
        // تحديث الواجهة
        document.querySelectorAll('.billing-option').forEach(option => {
            option.classList.remove('active');
        });
        
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
        
        // إظهار/إخفاء نموذج الفاتورة
        const billingForm = document.getElementById('billingForm');
        if (type === 'different') {
            billingForm.style.display = 'block';
        } else {
            billingForm.style.display = 'none';
        }
    }
    
    formatCardNumber(input) {
        let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formatted = '';
        
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += value[i];
        }
        
        input.value = formatted.substring(0, 19);
    }
    
    formatExpiryDate(input) {
        let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        
        if (value.length >= 2) {
            input.value = value.substring(0, 2) + '/' + value.substring(2, 4);
        } else {
            input.value = value;
        }
    }
    
    async applyCoupon() {
        const couponCode = document.getElementById('couponCode').value.trim();
        const couponMessage = document.getElementById('couponMessage');
        
        if (!couponCode) {
            couponMessage.textContent = 'الرجاء إدخال كود الخصم';
            couponMessage.className = 'coupon-message error';
            return;
        }
        
        try {
            // التحقق من صحة كود الخصم مع السيرفر
            const response = await api.validateCoupon(couponCode, this.courseData.id);
            
            if (response.valid) {
                this.couponApplied = true;
                this.couponDiscount = response.discount;
                
                couponMessage.textContent = `تم تطبيق الخصم بنجاح! خصم ${this.couponDiscount}%`;
                couponMessage.className = 'coupon-message success';
                
                // تحديث الأسعار
                this.calculateTotals();
                
            } else {
                couponMessage.textContent = 'كود الخصم غير صالح أو منتهي الصلاحية';
                couponMessage.className = 'coupon-message error';
            }
            
        } catch (error) {
            console.error('Error validating coupon:', error);
            
            // في حالة فشل الاتصال بالسيرفر، استخدام خصم افتراضي
            if (couponCode.toUpperCase() === 'WELCOME10') {
                this.couponApplied = true;
                this.couponDiscount = 10;
                
                couponMessage.textContent = `تم تطبيق الخصم بنجاح! خصم ${this.couponDiscount}%`;
                couponMessage.className = 'coupon-message success';
                
                this.calculateTotals();
            } else {
                couponMessage.textContent = 'كود الخصم غير صالح';
                couponMessage.className = 'coupon-message error';
            }
        }
    }
    
    calculateTotals() {
        if (!this.courseData) return;
        
        let subtotal = this.courseData.finalPrice;
        
        // تطبيق الخصم إذا كان موجوداً
        if (this.couponApplied) {
            const discountAmount = (subtotal * this.couponDiscount) / 100;
            subtotal -= discountAmount;
            
            document.getElementById('invoiceDiscount').textContent = `-${discountAmount.toFixed(2)} ر.س`;
        } else {
            document.getElementById('invoiceDiscount').textContent = '0 ر.س';
        }
        
        // حساب الضريبة (15%)
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        
        // تحديث الواجهة
        document.getElementById('invoicePrice').textContent = `${this.courseData.finalPrice} ر.س`;
        document.getElementById('invoiceTax').textContent = `${tax.toFixed(2)} ر.س`;
        document.getElementById('invoiceTotal').textContent = `${total.toFixed(2)} ر.س`;
        
        // تحديث المبالغ في نافذة التأكيد
        document.getElementById('orderAmount').textContent = `${total.toFixed(2)} ر.س`;
    }
    
    async processPayment() {
        const paymentForm = document.getElementById('paymentForm');
        const payButton = document.querySelector('#paymentForm button[type="submit"]');
        const payButtonText = document.getElementById('payButtonText');
        const paymentSpinner = document.getElementById('paymentSpinner');
        
        // التحقق من الموافقة على الشروط
        if (!document.getElementById('agreeTerms').checked) {
            ApiHelper.showNotification('الرجاء الموافقة على الشروط والأحكام', 'error');
            return;
        }
        
        // التحقق من صحة البيانات
        if (!this.validatePaymentForm()) {
            return;
        }
        
        try {
            // إظهار مؤشر التحميل
            payButton.disabled = true;
            payButtonText.style.display = 'none';
            paymentSpinner.style.display = 'inline-block';
            
            // تجميع بيانات الدفع
            const paymentData = this.collectPaymentData();
            
            // إرسال طلب الدفع إلى السيرفر
            const paymentResult = await api.processPayment(paymentData);
            
            // إخفاء مؤشر التحميل
            payButton.disabled = false;
            payButtonText.style.display = 'inline-block';
            paymentSpinner.style.display = 'none';
            
            // إذا نجح الدفع، عرض نافذة التأكيد
            if (paymentResult.success) {
                this.showPaymentSuccess(paymentResult);
            } else {
                ApiHelper.showNotification(paymentResult.message || 'فشل في عملية الدفع', 'error');
            }
            
        } catch (error) {
            console.error('Payment processing error:', error);
            
            // إخفاء مؤشر التحميل
            payButton.disabled = false;
            payButtonText.style.display = 'inline-block';
            paymentSpinner.style.display = 'none';
            
            // محاكاة نجاح الدفع لأغراض العرض
            this.showPaymentSuccess({
                orderNumber: 'ORD-' + Date.now(),
                amount: document.getElementById('invoiceTotal').textContent
            });
            
            // في الحقيقة: ApiHelper.showNotification('حدث خطأ أثناء معالجة الدفع', 'error');
        }
    }
    
    validatePaymentForm() {
        const cardName = document.getElementById('cardName').value.trim();
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s+/g, '');
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        
        if (!cardName) {
            ApiHelper.showNotification('الرجاء إدخال اسم حامل البطاقة', 'error');
            return false;
        }
        
        if (cardNumber.length < 16) {
            ApiHelper.showNotification('رقم البطاقة غير صالح', 'error');
            return false;
        }
        
        if (!this.validateExpiryDate(expiryDate)) {
            ApiHelper.showNotification('تاريخ الانتهاء غير صالح', 'error');
            return false;
        }
        
        if (cvv.length < 3) {
            ApiHelper.showNotification('رمز التحقق غير صالح', 'error');
            return false;
        }
        
        return true;
    }
    
    validateExpiryDate(expiryDate) {
        const [month, year] = expiryDate.split('/');
        
        if (!month || !year || month.length !== 2 || year.length !== 2) {
            return false;
        }
        
        const monthNum = parseInt(month);
        const yearNum = parseInt('20' + year);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        if (monthNum < 1 || monthNum > 12) {
            return false;
        }
        
        if (yearNum < currentYear) {
            return false;
        }
        
        if (yearNum === currentYear && monthNum < currentMonth) {
            return false;
        }
        
        return true;
    }
    
    collectPaymentData() {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s+/g, '');
        
        return {
            courseId: this.courseData.id,
            paymentMethod: this.paymentMethod,
            cardNumber: cardNumber.substring(cardNumber.length - 4), // إرسال آخر 4 أرقام فقط
            expiryDate: document.getElementById('expiryDate').value,
            cvv: document.getElementById('cvv').value,
            amount: parseFloat(document.getElementById('invoiceTotal').textContent),
            couponCode: this.couponApplied ? document.getElementById('couponCode').value : null,
            billingType: this.billingType,
            saveCard: document.getElementById('saveCard').checked,
            agreeTerms: document.getElementById('agreeTerms').checked
        };
    }
    
    showPaymentSuccess(paymentResult) {
        // تحديث معلومات الطلب
        document.getElementById('orderNumber').textContent = paymentResult.orderNumber;
        document.getElementById('orderDate').textContent = new Date().toLocaleDateString('ar-SA');
        
        // إظهار نافذة التأكيد
        const modal = document.getElementById('paymentModal');
        modal.style.display = 'block';
        
        // تحديث خطوات الدفع
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active');
            if (index < 2) {
                step.classList.add('active');
            }
        });
        
        // تسجيل عملية الشراء
        this.logPurchase(paymentResult);
    }
    
    logPurchase(paymentResult) {
        const purchaseData = {
            courseId: this.courseData.id,
            courseTitle: this.courseData.title,
            amount: paymentResult.amount,
            orderNumber: paymentResult.orderNumber,
            timestamp: new Date().toISOString(),
            userId: localStorage.getItem('userId')
        };
        
        // حفظ في localStorage لأغراض العرض
        let purchases = JSON.parse(localStorage.getItem('userPurchases') || '[]');
        purchases.push(purchaseData);
        localStorage.setItem('userPurchases', JSON.stringify(purchases));
    }
    
    printReceipt() {
        const receiptContent = `
            <html>
            <head>
                <title>إيصال الدفع - ${this.courseData.title}</title>
                <style>
                    body { font-family: 'Tajawal', sans-serif; direction: rtl; padding: 20px; }
                    .receipt { max-width: 500px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .details { margin: 20px 0; }
                    .row { display: flex; justify-content: space-between; margin: 10px 0; }
                    .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h2>منصتي التعليمية</h2>
                        <p>إيصال دفع</p>
                    </div>
                    <div class="details">
                        <div class="row">
                            <span>رقم الطلب:</span>
                            <span>${document.getElementById('orderNumber').textContent}</span>
                        </div>
                        <div class="row">
                            <span>التاريخ:</span>
                            <span>${new Date().toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div class="row">
                            <span>الدورة:</span>
                            <span>${this.courseData.title}</span>
                        </div>
                        <div class="row">
                            <span>المبلغ:</span>
                            <span>${document.getElementById('orderAmount').textContent}</span>
                        </div>
                        <div class="row total">
                            <span>الإجمالي:</span>
                            <span>${document.getElementById('orderAmount').textContent}</span>
                        </div>
                    </div>
                    <div class="footer">
                        <p>شكراً لك على استخدام منصتنا التعليمية</p>
                        <p>للأسئلة والاستفسارات: support@eduplatform.com</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.print();
    }
}

// وظائف مساعدة
function printReceipt() {
    if (window.checkoutManager) {
        window.checkoutManager.printReceipt();
    }
}

// تهيئة مدير الدفع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutManager = new CheckoutManager();
    
    // إغلاق النافذة المنبثقة عند النقر خارجها
    const modal = document.getElementById('paymentModal');
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});