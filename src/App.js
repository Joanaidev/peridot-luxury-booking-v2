import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './index.css';
import { packages, categoryNames, addons } from './packages.js';
import PerryAssistant from './components/PerryAssistant.js';
import { 
  addBooking, 
  getBookings, 
  updateBookingStatus,
  getDiscountCodes,
  getDiscountCodeByCode,
  addDiscountCode,
  addAdminNotification,
  getAdminNotifications,
  saveSettings,
  getSettings,
  saveBlockedDates,
  getBlockedDates,
  saveBlockedTimeSlots,
  getBlockedTimeSlots,
  subscribeToBookings,
  subscribeToNotifications
} from './firebaseService.js';
function App() {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(0);
  
  // Client form states
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    paymentName: '',
    preferredCommunication: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [showTermsPopup, setShowTermsPopup] = useState(false);

  const [bookings, setBookings] = useState([]); // Firebase bookings
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin states
  const [currentView, setCurrentView] = useState('client'); // 'client' or 'admin'
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [adminCurrentTab, setAdminCurrentTab] = useState('dashboard');

  // Enhanced admin states
  const [blockedDates, setBlockedDates] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showPackageEditor, setShowPackageEditor] = useState(false);

  // At the top of App function, add:
  const [hstSelectedMonth, setHstSelectedMonth] = React.useState(new Date().getMonth());
  const [hstSelectedYear, setHstSelectedYear] = React.useState(new Date().getFullYear());

  // At the top of App function, after other useState hooks:
  const [calendarView, setCalendarView] = useState('year');

  // AUTO-SAVE PROGRESS
  const [bookingProgress, setBookingProgress] = useState(() => {
    const saved = localStorage.getItem('peridotBookingProgress');
    return saved ? JSON.parse(saved) : null;
  });

  // WEATHER ALERT FOR OUTDOOR SESSIONS
  const [weatherData, setWeatherData] = useState(null);

  // VOICE COMMANDS FOR ACCESSIBILITY
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // EMAIL AUTOMATION SYSTEM
  const [emailSettings, setEmailSettings] = useState(() => {
    const saved = localStorage.getItem('peridotEmailSettings');
    return saved ? JSON.parse(saved) : {
      autoConfirmation: true,
      autoReminders: true,
      autoFollowUp: true,
      reminderDays: 2,
      followUpDays: 3
    };
  });

  // eslint-disable-next-line no-unused-vars
  const [emailTemplates, setEmailTemplates] = useState(() => {
    const saved = localStorage.getItem('peridotEmailTemplates');
    return saved ? JSON.parse(saved) : {
      confirmation: {
        subject: 'Booking Confirmed - Your Peridot Images Session',
        body: `Dear {clientName},

Your photography session has been confirmed!

📋 SESSION DETAILS:
Date: {sessionDate}
Time: {sessionTime}
Package: {packageName}
Location: Barrhaven Studio, Ottawa

📧 We'll send you a preparation guide 48 hours before your session.
📋 <a href="https://peridotimages.mypixieset.com/get-ready/" target="_blank" rel="noopener noreferrer" style="color: #f59e0b; text-decoration: underline;">View our Get Ready Guide here</a>
📸 Your edited photos will be ready within 7-10 business days after you select your favorites.

Thank you for choosing Peridot Images!

Best regards,
The Peridot Images Team`
      },
      reminder: {
        subject: 'Session Reminder - Tomorrow at {sessionTime}',
        body: `Hi {clientName},

Just a friendly reminder about your photography session tomorrow!

📅 {sessionDate} at {sessionTime}
📍 Barrhaven Studio, Ottawa
📦 {packageName}

PREPARATION TIPS:
- Arrive 10 minutes early
- Bring your outfits as discussed
- Come well-rested and ready to smile!

See you tomorrow!

Peridot Images Team`
      },
      followUp: {
        subject: 'Thank You + Your Photos Are Ready!',
        body: `Dear {clientName},

Thank you for an amazing session! Your photos are now ready.

📸 View & Download: [Gallery Link]
⭐ We'd love a review if you're happy with your experience!

Questions? Just reply to this email.

With gratitude,
Peridot Images Team`
      },
      birthday: {
        subject: '🎂 Perry Birthday to You!',
        body: `Dear {clientName},

🎉 Perry Birthday to you! 🎉

On your special day, we wanted to send you a little something extra special...

🎁 BIRTHDAY OFFER:
Reply to this email and we'll send you a unique discount code for your birthday!

📸 Perfect timing to capture your beautiful moments!

Ready to celebrate? Just reply to this email or call us at (647) 444-3767 to book your birthday session.

Wishing you a day filled with joy, laughter, and beautiful memories!

With warmest wishes,
The Peridot Images Team
📧 imagesbyperidot@gmail.com
📱 (647) 444-3767`
      },
      cancellation: {
        subject: 'Booking Expired - But We Can Still Help!',
        body: `Hi {clientName},

We noticed your recent booking for {packageName} on {sessionDate} at {sessionTime} has expired.

But don't worry! We'd love to help you reschedule and get those beautiful photos you deserve.

🎯 QUICK REBOOKING:
- Your selected package is still available
- We can find another perfect time slot
- No additional fees for rescheduling

📞 Just call us at (647) 444-3767 or reply to this email to get your session back on the calendar!

Looking forward to capturing your beautiful moments!

Best regards,
The Peridot Images Team
📧 imagesbyperidot@gmail.com
📱 (647) 444-3767`
      }
    };
  });

  // Additional state for time management
  const [blockedTimeSlots, setBlockedTimeSlots] = useState({});
  const [fakeBookings, setFakeBookings] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [weekdaysEnabled, setWeekdaysEnabled] = useState(true);

  // CLIENT MANAGEMENT SYSTEM
  // eslint-disable-next-line no-unused-vars
  const [clientNotes, setClientNotes] = useState(() => {
    const saved = localStorage.getItem('peridotClientNotes');
    return saved ? JSON.parse(saved) : {};
  });

  // Add these new state variables for discount management
  const [discountCodes, setDiscountCodes] = useState([]);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountFormData, setDiscountFormData] = useState({
    code: '',
    type: 'percentage', // 'percentage' or 'fixed'
    value: '',
    description: '',
    expiryDate: '',
    usageLimit: '',
    isActive: true
  });

  // VISITOR ANALYTICS & LOCATION TRACKING
  const [visitorAnalytics, setVisitorAnalytics] = useState(() => {
    const saved = localStorage.getItem('peridotVisitorAnalytics');
    return saved ? JSON.parse(saved) : {
      totalVisitors: 0,
      uniqueVisitors: 0,
      pageViews: 0,
      locations: {},
      referrers: {},
      devices: {},
      browsers: {},
      dailyStats: {},
      conversionFunnel: {
        visitors: 0,
        categoryViews: 0,
        packageViews: 0,
        bookingStarted: 0,
        bookingCompleted: 0
      }
    };
  });

  // Load data from Firebase on component mount
  useEffect(() => {
    const loadFirebaseData = async () => {
      try {
        setLoading(true);
        
        // Load bookings
        const bookingsData = await getBookings();
        setBookings(bookingsData);
        
        // Load discount codes
        const discountData = await getDiscountCodes();
        setDiscountCodes(discountData);
        
        // Load blocked dates
        const blockedDatesData = await getBlockedDates();
        setBlockedDates(blockedDatesData);
        
        // Load blocked time slots
        const blockedTimeSlotsData = await getBlockedTimeSlots();
        setBlockedTimeSlots(blockedTimeSlotsData);
        
        // Load settings
        const emailSettingsData = await getSettings('emailSettings');
        if (emailSettingsData) {
          setEmailSettings(emailSettingsData);
        }
        
        const emailTemplatesData = await getSettings('emailTemplates');
        if (emailTemplatesData) {
          setEmailTemplates(emailTemplatesData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading Firebase data:', error);
        setLoading(false);
      }
    };

    loadFirebaseData();
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    // Subscribe to bookings changes
    const unsubscribeBookings = subscribeToBookings((bookings) => {
      setBookings(bookings);
    });

    // Subscribe to notifications changes
    const unsubscribeNotifications = subscribeToNotifications((notifications) => {
      // Handle notifications if needed
    });

    return () => {
      unsubscribeBookings();
      unsubscribeNotifications();
    };
  }, []);

  // Save email settings to Firebase when they change
  useEffect(() => {
    const saveEmailSettings = async () => {
      try {
        await saveSettings('emailSettings', emailSettings);
      } catch (error) {
        console.error('Error saving email settings:', error);
      }
    };

    if (emailSettings) {
      saveEmailSettings();
    }
  }, [emailSettings]);

  // Save email templates to Firebase when they change
  useEffect(() => {
    const saveEmailTemplates = async () => {
      try {
        await saveSettings('emailTemplates', emailTemplates);
      } catch (error) {
        console.error('Error saving email templates:', error);
      }
    };

    if (emailTemplates) {
      saveEmailTemplates();
    }
  }, [emailTemplates]);

  const [currentSession, setCurrentSession] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // --- Package & Category Management State ---
  const [localPackages, setLocalPackages] = useState(() => {
    const saved = localStorage.getItem('peridotPackages');
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(packages));
  });
  const [localCategoryNames, setLocalCategoryNames] = useState(() => {
    const saved = localStorage.getItem('peridotCategoryNames');
    return saved ? JSON.parse(saved) : { ...categoryNames };
  });
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', key: '' });
  const [packageFormData, setPackageFormData] = useState({
    name: '', price: '', duration: '', people: '', outfits: '', backdrops: '', images: '', location: '', special: '', note: '', isActive: true
  });
// Secret Admin Access
React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const adminKey = urlParams.get('admin');
    
    if (adminKey === 'secret2025') {
      setCurrentView('admin');
    }
    
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setCurrentView('admin');
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);
  // Sync localPackages and localCategoryNames to localStorage
  React.useEffect(() => {
    localStorage.setItem('peridotPackages', JSON.stringify(localPackages));
  }, [localPackages]);

  React.useEffect(() => {
    localStorage.setItem('peridotCategoryNames', JSON.stringify(localCategoryNames));
  }, [localCategoryNames]);

  // Handler: Add Category
  function addCategory() {
    if (!categoryFormData.key || !categoryFormData.name) return alert('Please enter both key and name.');
    if (localPackages[categoryFormData.key]) return alert('Category key already exists.');
    setLocalPackages(prev => ({ ...prev, [categoryFormData.key]: [] }));
    setLocalCategoryNames(prev => ({ ...prev, [categoryFormData.key]: categoryFormData.name }));
    setSelectedCategory(categoryFormData.key);
    setCategoryFormData({ name: '', key: '' });
    setShowCategoryForm(false);
  }

  // Handler: Delete Category
  function deleteCategory(categoryKey) {
    if (!window.confirm(`Are you sure you want to delete the category "${localCategoryNames[categoryKey]}"? This will also delete all packages in this category.`)) return;
    
    setLocalPackages(prev => {
      const newPackages = { ...prev };
      delete newPackages[categoryKey];
      return newPackages;
    });
    
    setLocalCategoryNames(prev => {
      const newCategoryNames = { ...prev };
      delete newCategoryNames[categoryKey];
      return newCategoryNames;
    });
    
    // If the deleted category was selected, clear the selection
    if (selectedCategory === categoryKey) {
      setSelectedCategory('');
    }
  }

  // Handler: Add Package
  function addPackage() {
    if (!selectedCategory) return alert('Select a category first.');
    if (!packageFormData.name || !packageFormData.price) return alert('Name and price required.');
    const newPkg = { ...packageFormData, id: `${packageFormData.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}` };
    setLocalPackages(prev => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), newPkg]
    }));
    setShowPackageEditor(false);
    setEditingPackage(null);
    setPackageFormData({ name: '', price: '', duration: '', people: '', outfits: '', backdrops: '', images: '', location: '', special: '', note: '', isActive: true });
  }

  // Handler: Update Package
  function updatePackage() {
    setLocalPackages(prev => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory].map(pkg =>
        pkg.id === editingPackage.id ? { ...packageFormData, id: editingPackage.id } : pkg
      )
    }));
    setShowPackageEditor(false);
    setEditingPackage(null);
    setPackageFormData({ name: '', price: '', duration: '', people: '', outfits: '', backdrops: '', images: '', location: '', special: '', note: '', isActive: true });
  }

  // Handler: Duplicate Package
  function duplicatePackage(pkg) {
    const newPkg = { ...pkg, id: `${pkg.name.replace(/\s+/g, '-').toLowerCase()}-copy-${Date.now()}`, name: pkg.name + ' (Copy)' };
    setLocalPackages(prev => ({
      ...prev,
      [selectedCategory]: [...prev[selectedCategory], newPkg]
    }));
  }

  // Handler: Delete Package
  function deletePackage(id) {
    if (!window.confirm('Delete this package?')) return;
    setLocalPackages(prev => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory].filter(pkg => pkg.id !== id)
    }));
  }

  // Handler: Toggle Package Status
  function togglePackageStatus(id) {
    setLocalPackages(prev => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory].map(pkg =>
        pkg.id === id ? { ...pkg, isActive: pkg.isActive === false ? true : false } : pkg
      )
    }));
  }

  // Load blocked dates from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('peridotBlockedDates');
    if (saved) {
      setBlockedDates(JSON.parse(saved));
    }
  }, []);

  // Load blocked time slots from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('peridotBlockedTimeSlots');
    if (saved) {
      setBlockedTimeSlots(JSON.parse(saved));
    }
  }, []);

  // Load fake bookings from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('peridotFakeBookings');
    if (saved) {
      setFakeBookings(JSON.parse(saved));
    }
  }, []);

  // Track abandonment points and user progress
  React.useEffect(() => {
    // Track abandonment points
    if (currentStep !== 'welcome') {
      const abandonmentData = {
        step: currentStep,
        timestamp: new Date(),
        package: selectedPackage?.name,
        email: clientInfo.email
      };
      // Store in localStorage (your app already uses this pattern)
      localStorage.setItem('peridotAbandonment', JSON.stringify(abandonmentData));
    }
  }, [currentStep, selectedPackage, clientInfo.email]);

  // HST Calculation (13% for Ontario, Canada)
  const calculateHST = (amount) => {
    const subtotal = parseFloat(amount) || 0;
    const hst = subtotal * 0.13;
    const total = subtotal + hst;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      hst: Math.round(hst * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  };

  // Block/Unblock date functions
  const toggleDateBlock = async (date) => {
    try {
      const newBlocked = blockedDates.includes(date) 
        ? blockedDates.filter(d => d !== date)
        : [...blockedDates, date];
      
      await saveBlockedDates(newBlocked);
      setBlockedDates(newBlocked);
    } catch (error) {
      console.error('Error updating blocked dates:', error);
      alert('Error updating blocked dates. Please try again.');
    }
  };

  // Block/Unblock time slot functions
  const toggleTimeSlotBlock = async (date, time) => {
    try {
      const dateKey = date;
      const currentSlots = blockedTimeSlots[dateKey] || [];
      const newSlots = currentSlots.includes(time)
        ? currentSlots.filter(t => t !== time)
        : [...currentSlots, time];
      
      const newBlockedTimeSlots = {
        ...blockedTimeSlots,
        [dateKey]: newSlots
      };
      
      await saveBlockedTimeSlots(newBlockedTimeSlots);
      setBlockedTimeSlots(newBlockedTimeSlots);
    } catch (error) {
      console.error('Error updating blocked time slots:', error);
      alert('Error updating blocked time slots. Please try again.');
    }
  };

  // Add/Remove fake booking functions
  const addFakeBooking = (date, time, clientName = 'Test Client') => {
    setFakeBookings(prev => {
      const dateKey = date;
      const currentBookings = prev[dateKey] || [];
      const newBookings = [...currentBookings, { time, clientName }];
      const newFakeBookings = { ...prev, [dateKey]: newBookings };
      localStorage.setItem('peridotFakeBookings', JSON.stringify(newFakeBookings));
      return newFakeBookings;
    });
  };

  const removeFakeBooking = (date, time) => {
    setFakeBookings(prev => {
      const dateKey = date;
      const currentBookings = prev[dateKey] || [];
      const newBookings = currentBookings.filter(b => b.time !== time);
      const newFakeBookings = { ...prev, [dateKey]: newBookings };
      localStorage.setItem('peridotFakeBookings', JSON.stringify(newFakeBookings));
      return newFakeBookings;
    });
  };

  // Invoice generation
  const generateInvoice = (booking) => {
    const invoiceNumber = `INV-${Date.now()}`;
    const hstBreakdown = calculateHSTBreakdown(booking.totalPrice);
    
    const invoice = {
      invoiceNumber,
      clientName: booking.clientName,
      email: booking.email,
      phone: booking.phone,
      package: booking.package,
      sessionDate: booking.date,
      sessionTime: booking.time,
      addons: booking.addons || [],
      discount: booking.discount,
      subtotal: hstBreakdown.serviceAmount,
      hst: hstBreakdown.hstAmount,
      total: hstBreakdown.total,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: booking.date,
      status: 'sent',
      createdAt: new Date().toISOString()
    };
    
    return invoice;
  };

  // Download invoice as professional HTML
  const downloadInvoice = (booking) => {
    const invoice = generateInvoice(booking);
    const hstBreakdown = calculateHSTBreakdown(booking.totalPrice);
    
    // Create a more professional PDF-ready HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
              @media print { 
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
              }
              body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #2d3748; background: white; }
              .invoice-container { max-width: 800px; margin: 0 auto; background: white; border: 2px solid #f59e0b; border-radius: 12px; overflow: hidden; }
              .invoice-header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; }
              .logo { font-size: 2.5rem; font-weight: bold; margin-bottom: 8px; }
              .company-tagline { font-size: 1rem; opacity: 0.9; }
              .invoice-title { background: #2d3748; color: white; text-align: center; padding: 20px; font-size: 1.8rem; font-weight: bold; margin: 0; }
              .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 30px; background: #f7fafc; }
              .details-section h3 { color: #f59e0b; margin-bottom: 15px; font-size: 1.2rem; border-bottom: 2px solid #f59e0b; padding-bottom: 5px; }
              .details-section p { margin: 8px 0; line-height: 1.6; }
              .services-section { padding: 30px; }
              .services-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .services-table th { background: #f59e0b; color: white; padding: 15px; text-align: left; font-weight: bold; }
              .services-table td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }
              .services-table tr:nth-child(even) { background: #f8fafc; }
              .totals-section { background: #2d3748; color: white; padding: 30px; }
              .totals-table { width: 100%; max-width: 400px; margin-left: auto; }
              .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 1.1rem; }
              .total-row.final { font-weight: bold; font-size: 1.4rem; color: #fbbf24; border-top: 2px solid #fbbf24; padding-top: 15px; margin-top: 10px; }
              .payment-info { background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 30px; }
              .payment-info h4 { color: #1e40af; margin-bottom: 15px; }
              .payment-details { font-weight: bold; color: #1e40af; }
              .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
              .download-btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin: 10px; }
              .email-btn { background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin: 10px; }
          </style>
      </head>
      <body>
          <div class="invoice-container">
              <div class="invoice-header">
                  <div class="logo">Peridot Images</div>
                  <div class="company-tagline">Professional Photography Services • Ottawa, Canada</div>
              </div>

              <div class="invoice-title">INVOICE ${invoice.invoiceNumber}</div>

              <div class="invoice-details">
                  <div class="details-section">
                      <h3>Bill To:</h3>
                      <p><strong>${booking.clientName}</strong></p>
                      <p>📧 ${booking.email}</p>
                      <p>📱 ${booking.phone}</p>
                  </div>
                  <div class="details-section">
                      <h3>Session Details:</h3>
                      <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p><strong>Time:</strong> ${booking.time}</p>
                      <p><strong>Duration:</strong> ${booking.duration}</p>
                      <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString('en-CA')}</p>
                      <p><strong>Due Date:</strong> ${booking.date}</p>
                  </div>
              </div>

              <div class="services-section">
                  <table class="services-table">
                      <thead>
                          <tr>
                              <th>Service Description</th>
                              <th>Amount (HST Included)</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td>
                                  <strong>${booking.package}</strong><br>
                                  <small>Professional photography session at Barrhaven Studio</small>
                              </td>
                              <td><strong>$${booking.totalPrice}</strong></td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              <div class="totals-section">
                  <div class="totals-table">
                      <div class="total-row">
                          <span>Service Amount:</span>
                          <span>$${hstBreakdown.serviceAmount}</span>
                      </div>
                      <div class="total-row">
                          <span>HST (13% Ontario):</span>
                          <span>$${hstBreakdown.hstAmount}</span>
                      </div>
                      <div class="total-row final">
                          <span>Total Amount Due:</span>
                          <span>$${hstBreakdown.total}</span>
                      </div>
                  </div>
              </div>

              <div class="payment-info">
                  <h4>💳 Payment Instructions</h4>
                  <p>Please send e-transfer to: <span class="payment-details">alongejoan@gmail.com</span></p>
                  <p>Reference: <span class="payment-details">${booking.clientName} - Invoice ${invoice.invoiceNumber}</span></p>
                  <p><em>Payment due by session date. All prices include HST.</em></p>
              </div>

              <div class="footer">
                  <p><strong>Peridot Images</strong> • Barrhaven Studio, Ottawa</p>
                  <p>📧 imagesbyperidot@gmail.com • 📱 (647) 444-3767 • 📸 @peridotimages</p>
                  <p><em>Thank you for choosing Peridot Images for your special moments!</em></p>
              </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin: 20px;">
              <button class="download-btn" onclick="window.print()">📄 Print/Save as PDF</button>
              <button class="email-btn" onclick="sendInvoiceEmail()">📧 Email to Client</button>
              <p><em>Use "Print/Save as PDF" to download the invoice, then attach it to your email.</em></p>
          </div>

          <script>
              function sendInvoiceEmail() {
                  const subject = encodeURIComponent('Invoice ${invoice.invoiceNumber} - Your Peridot Images Session');
                  const body = encodeURIComponent('Dear ${booking.clientName},\\n\\nThank you for booking with Peridot Images! Please find your invoice attached.\\n\\n📋 INVOICE DETAILS:\\nInvoice Number: ${invoice.invoiceNumber}\\nSession Date: ${new Date(booking.date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\\nSession Time: ${booking.time}\\nPackage: ${booking.package}\\nTotal Amount: $${booking.totalPrice} (HST included)\\n\\n💳 PAYMENT INSTRUCTIONS:\\nPlease send e-transfer to: alongejoan@gmail.com\\nReference: ${booking.clientName} - Invoice ${invoice.invoiceNumber}\\n\\n📍 SESSION LOCATION:\\nBarrhaven Studio, Ottawa\\n\\nIMPORTANT: Please save this invoice as a PDF first (using the Print/Save as PDF button above), then attach it to this email before sending.\\n\\nWe\\'re excited to create beautiful memories with you!\\n\\nBest regards,\\nPeridot Images Team\\n📧 imagesbyperidot@gmail.com\\n📱 (647) 444-3767\\n📸 @peridotimages');
                  
                  const mailtoLink = 'mailto:${booking.email}?subject=' + subject + '&body=' + body;
                  window.opener.location.href = mailtoLink;
                  alert('Email client opened! Please save this invoice as PDF first, then attach it to the email before sending.');
              }
          </script>
      </body>
      </html>
    `;
    
    // Open invoice in new window for printing/saving as PDF
    const newWindow = window.open('', '_blank');
    newWindow.document.write(invoiceHTML);
    newWindow.document.close();
    
    // Mark invoice as sent in booking
    updateBookingStatus(booking.id, booking.status, booking.paymentStatus, { invoiceSent: true });
  };

  // Email invoice to client
  const emailInvoice = (booking) => {
    const invoice = generateInvoice(booking);
    const hstBreakdown = calculateHSTBreakdown(booking.totalPrice);
    
    // Get package details
    const selectedPackage = packages.find(pkg => pkg.name === booking.package);
    const packageDetails = selectedPackage ? selectedPackage.details : [];
    
    // Format addons
    const addonsList = booking.addons && booking.addons.length > 0 
      ? booking.addons.map(addon => `• ${addon.name} (+$${addon.price})`).join('\n')
      : 'None selected';
    
    // Calculate days until session
    const sessionDate = new Date(booking.date);
    const today = new Date();
    // eslint-disable-next-line no-unused-vars
    const daysUntilSession = Math.ceil((sessionDate - today) / (1000 * 60 * 60 * 24));
    
    const subject = `Invoice ${invoice.invoiceNumber} - Your Peridot Images Session`;
    const body = `Dear ${booking.clientName},

Thank you for booking with Peridot Images! Please find your detailed session information and invoice below.

📋 BOOKING CONFIRMATION:
Invoice Number: ${invoice.invoiceNumber}
Session Date: ${new Date(booking.date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Session Time: ${booking.time}
Duration: ${booking.duration || 'Standard session duration'}

📸 YOUR PACKAGE DETAILS:
Package: ${booking.package}
${packageDetails.map(detail => `• ${detail}`).join('\n')}

🎁 SELECTED ADD-ONS:
${addonsList}

💰 PAYMENT BREAKDOWN:
Service Amount: $${hstBreakdown.serviceAmount}
HST (13%): $${hstBreakdown.hstAmount}
Total Amount Due: $${hstBreakdown.total}

💳 PAYMENT INSTRUCTIONS:
Please send e-transfer to: alongejoan@gmail.com
Reference: ${booking.clientName} - Invoice ${invoice.invoiceNumber}

📍 SESSION LOCATION:
Barrhaven Studio, Ottawa

📞 IMPORTANT: SHOOTING PLAN CONTACT
I will contact you approximately 1 week before your session to discuss your shooting plan, preferences, and any specific ideas you have for your photos. This ensures we create exactly what you envision!

🔔 WHAT TO EXPECT:
1. Complete payment via e-transfer using the details above
2. I'll reach out 1 week before your session to plan your shoot
3. You'll receive a session preparation guide 48 hours before your appointment
4. Your beautifully edited photos will be delivered within 7-10 business days after your session

💾 DOWNLOAD YOUR INVOICE:
For a printable PDF version of this invoice (for your tax records), please visit your booking confirmation or contact us.

We're excited to create beautiful memories with you!

Best regards,
The Peridot Images Team

📧 imagesbyperidot@gmail.com
📱 (647) 444-3767
📸 @peridotimages
🌐 Barrhaven Studio, Ottawa`;

    const mailtoLink = `mailto:${booking.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    
    // Also open the PDF version for admin to download and attach if needed
    setTimeout(() => {
      if (window.confirm('Would you like to open the PDF invoice as well? You can save it and attach it to the email if needed.')) {
        downloadInvoice(booking);
      }
    }, 1000);
    
    // Mark invoice as sent
    updateBookingStatus(booking.id, booking.status, booking.paymentStatus, { invoiceSent: true });
  };

  // Auto-send invoice when payment confirmed
  const confirmBookingWithInvoice = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      updateBookingStatus(bookingId, 'confirmed', 'paid');
      emailInvoice(booking);
      
      // Auto-send reminder email if enabled
      if (emailSettings.autoReminders) {
        sendAutomatedEmail(booking, 'reminder');
      }
      
      alert('✅ Booking confirmed and invoice sent to client!');
    }
  };

  // Admin functions
  const handleAdminLogin = () => {
    const email = adminCredentials.email.trim().toLowerCase();
    const password = adminCredentials.password.trim();
    
    if (email === 'imagesbyperidot@gmail.com' && password === 'peridot2025') {
      console.log('Admin login successful, loading bookings...');
      setIsAdminAuthenticated(true);
      
      // Load bookings from Firebase immediately
      const loadAdminBookings = async () => {
        try {
          console.log('Loading admin bookings from Firebase...');
          const bookingsData = await getBookings();
          console.log('Bookings loaded:', bookingsData.length, 'bookings');
          setBookings(bookingsData);
          
          // Also load notifications
          const notificationsData = await getAdminNotifications();
          console.log('Notifications loaded:', notificationsData.length, 'notifications');
          setAdminNotifications(notificationsData);
          
        } catch (error) {
          console.error('Error loading admin data:', error);
          alert('Error loading admin data. Please try again.');
        }
      };
      
      loadAdminBookings();
    } else {
      alert('❌ Invalid email or password. Use the quick-fill buttons if needed.');
    }
  };

  const handleAdminLogout = () => {
    // Clean up real-time subscriptions
    if (window.adminUnsubscribe) {
      window.adminUnsubscribe();
      window.adminUnsubscribe = null;
    }
    
    setCurrentView('client');
    setIsAdminAuthenticated(false);
    setAdminCredentials({ email: '', password: '' });
    setAdminCurrentTab('dashboard');
    setBookings([]); // Clear bookings when logging out
  };

  const updateBookingStatus = useCallback(async (bookingId, newStatus, paymentStatus = null, extraData = {}) => {
    try {
      const updateData = {
        status: newStatus,
        ...(paymentStatus && { paymentStatus }),
        ...(newStatus === 'confirmed' && { confirmedAt: new Date().toISOString() }),
        ...(newStatus === 'cancelled' && { cancelledAt: new Date().toISOString() }),
        ...extraData // For invoice tracking, etc.
      };
      
      // Update in Firebase
      await updateBookingStatus(bookingId, newStatus, paymentStatus, updateData);
      
      // Update local state
      setBookings(prev => {
        const updated = prev.map(booking => {
          if (booking.id === bookingId) {
            return { ...booking, ...updateData };
          }
          return booking;
        });
        return updated;
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status. Please try again.');
    }
  }, []);

  const calculateRevenue = () => {
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid');
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const monthlyRevenue = confirmedBookings
      .filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      })
      .reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    return { totalRevenue, monthlyRevenue, confirmedCount: confirmedBookings.length };
  };

  const exportBookingsCSV = () => {
    const headers = ['Date Created', 'Client Name', 'Email', 'Phone', 'Package', 'Session Date', 'Session Time', 'Total Price', 'Status', 'Payment Status'];
    const csvData = bookings.map(booking => [
      new Date(booking.createdAt).toLocaleDateString(),
      booking.clientName,
      booking.email,
      booking.phone,
      booking.package,
      booking.date,
      booking.time,
      `$${booking.totalPrice}`,
      booking.status,
      booking.paymentStatus
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peridot-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get available times based on selected date
  const getAvailableTimesForDate = (date) => {
    if (!date) return [];
    const dayOfWeek = new Date(date).getDay();
    
    if (dayOfWeek === 6) { // Saturday
      return ['11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
    } else if (dayOfWeek === 0) { // Sunday
      return ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
    }
    return [];
  };

  // Generate weekend dates for full year (June 2025 - May 2026)
  const generateMonthlyCalendar = () => {
    const today = new Date();
    const months = [];
    
    // Generate 12 months starting from current month
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const weekendDates = [];
      
      // Get all weekend dates for this month
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const dayOfWeek = date.getDay();
        
        // Only include weekends (Saturday = 6, Sunday = 0)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          const dateString = date.toISOString().split('T')[0];
          // Only include future dates
          if (date >= today) {
            // Check if date is blocked
            if (blockedDates && blockedDates.includes(dateString)) continue;
            // Check if at least one available time slot
            const availableTimes = getAvailableTimesForDate(dateString);
            const blockedSlots = blockedTimeSlots[dateString] || [];
            const realBookings = bookings.filter(b => b.date === dateString && b.status !== 'cancelled').map(b => b.time);
            // A time is available if it's not in blockedSlots and not already booked
            const hasAvailable = availableTimes.some(time => !blockedSlots.includes(time) && !realBookings.includes(time));
            if (!hasAvailable) continue;
            weekendDates.push({
              date: dateString,
              day: day,
              dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
            });
          }
        }
      }
      
      if (weekendDates.length > 0) {
        months.push({
          name: monthName,
          dates: weekendDates
        });
      }
    }
    
    return months;
  };

  const monthlyCalendar = generateMonthlyCalendar();

  const selectCategory = (category) => {
    if (category === 'otherservices') {
      const mailtoLink = 'mailto:imagesbyperidot@gmail.com?subject=Photography Services Inquiry&body=Hi, I am interested in your photography services. Can you provide me with more information?';
      window.location.href = mailtoLink;
      return;
    }
    setSelectedCategory(category);
    setCurrentStep('packages');
  };

  const selectPackage = (pkg) => {
    if (selectedCategory === 'otherservices') {
      const mailtoLink = `mailto:imagesbyperidot@gmail.com?subject=${pkg.name} Inquiry&body=Hi, I am interested in ${pkg.name.toLowerCase()}. Can you provide me with more information and pricing?`;
      window.location.href = mailtoLink;
      return;
    }
    setSelectedPackage(pkg);
    setCurrentStep('addons');
  };

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const isSelected = prev.find(a => a.id === addon.id);
      if (isSelected) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const applyDiscountCode = async (code) => {
    try {
      const discount = await getDiscountCodeByCode(code);
      if (discount && discount.isActive && new Date(discount.expiryDate) > new Date()) {
        setAppliedDiscount(discount);
        setDiscountCode('');
        alert('Discount applied successfully! ✨');
        return true;
      } else {
        alert('Invalid or expired discount code');
        return false;
      }
    } catch (error) {
      console.error('Error applying discount code:', error);
      alert('Error applying discount code. Please try again.');
      return false;
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
  };

  // KEEP THIS FUNCTION EXACTLY THE SAME - DON'T CHANGE IT!
  const calculateTotal = () => {
    if (!selectedPackage || typeof selectedPackage.price !== 'number') return 0;
    
    const packagePrice = selectedPackage.price;
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    let total = packagePrice + addonsPrice;
    
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        total = total * (1 - appliedDiscount.value / 100);
      } else if (appliedDiscount.type === 'fixed') {
        total = Math.max(0, total - appliedDiscount.value);
      }
    }
    
    return Math.round(total * 100) / 100;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
  };

  const formatDateLong = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!clientInfo.name || clientInfo.name.length < 2) {
      errors.name = 'Full name is required (minimum 2 characters)';
    }
    
    if (!clientInfo.email || !/\S+@\S+\.\S+/.test(clientInfo.email)) {
      errors.email = 'Valid email address is required';
    }
    
    if (!clientInfo.phone || clientInfo.phone.length < 10) {
      errors.phone = 'Valid phone number is required (minimum 10 digits)';
    }
    
    if (!clientInfo.paymentName || clientInfo.paymentName.length < 2) {
      errors.paymentName = 'Payment name is required';
    }
    
    if (!clientInfo.preferredCommunication) {
      errors.preferredCommunication = 'Please select your preferred communication method';
    }
    
    // Birthday validation (optional but if provided, must be valid format)
    if (clientInfo.birthday && !/^\d{2}-\d{2}$/.test(clientInfo.birthday)) {
      errors.birthday = 'Birthday must be in MM-DD format (e.g., 03-15)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClientFormSubmit = () => {
    if (validateForm()) {
      setShowTermsPopup(true);
    }
  };

  const handleTermsAccept = () => {
    setShowTermsPopup(false);
    setCurrentStep('payment');
  };

  const handleBookingComplete = async () => {
    if (isSubmitting) return; // Prevent multiple clicks
    setIsSubmitting(true); // This makes it show "Processing..."
    
    try {
      // console.log('Starting booking process...'); // Removed for production
      
      // Create booking object with proper status structure
      const newBooking = {
        clientName: clientInfo.name,
        email: clientInfo.email,
        phone: clientInfo.phone,
        birthday: clientInfo.birthday,
        paymentName: clientInfo.paymentName,
        preferredCommunication: clientInfo.preferredCommunication,
        package: selectedPackage.name,
        packagePrice: selectedPackage.price,
        addons: selectedAddons,
        discount: appliedDiscount,
        totalPrice: calculateTotal(),
        date: selectedDate,
        time: selectedTime,
        duration: selectedPackage.duration,
        location: 'Barrhaven Studio, Ottawa',
        status: 'held', // held, confirmed, cancelled
        paymentStatus: 'pending', // pending, paid, refunded
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        confirmedAt: null,
        cancelledAt: null
      };

      // console.log('About to save booking:', newBooking); // Removed for production
      
      // Save to Firebase
      const bookingId = await addBooking(newBooking);
      
      // console.log('Booking saved with ID:', bookingId); // Removed for production
      
      // Update local state with Firebase ID
      const bookingWithId = { ...newBooking, id: bookingId };
      setBookings(prev => [...prev, bookingWithId]);
      
      // Auto-send confirmation email if enabled
      if (emailSettings.autoConfirmation) {
        sendAutomatedEmail(bookingWithId, 'confirmation');
      }

      // Add admin notification for new booking
      await addAdminNotification('booking', `New booking from ${clientInfo.name} - ${selectedPackage.name} on ${formatDate(selectedDate)} at ${selectedTime}`, {
        bookingId: bookingId,
        clientName: clientInfo.name,
        packageName: selectedPackage.name,
        date: selectedDate,
        time: selectedTime
      });
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 New Booking - Peridot Images', {
          body: `${clientInfo.name} just booked ${selectedPackage.name} for ${formatDate(selectedDate)} at ${selectedTime}`,
          icon: '/logo192.png',
          tag: 'new-booking'
        });
      }
      
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Booking failed:', error); // This should show the real error
      alert('Booking failed: ' + error.message);
    } finally {
      setIsSubmitting(false); // ADD THIS LINE - this will stop "Processing..."
    }
  };

  // CORRECT HST CALCULATION - For prices that INCLUDE HST
  const calculateHSTBreakdown = (totalPriceIncludingHST) => {
    const total = parseFloat(totalPriceIncludingHST) || 0;
    // Work backwards from total: if $250 includes HST, then service = $250 ÷ 1.13
    const serviceAmount = total / 1.13;
    const hstAmount = total - serviceAmount;
    
    return {
      serviceAmount: Math.round(serviceAmount * 100) / 100,
      hstAmount: Math.round(hstAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  };

  // Monthly HST calculator for admin
  const calculateMonthlyHST = (bookings, month = null, year = null) => {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth();
    const targetYear = year || currentDate.getFullYear();
    
    const monthlyBookings = bookings.filter(booking => {
      if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') return false;
      
      const bookingDate = new Date(booking.createdAt);
      return bookingDate.getMonth() === targetMonth && bookingDate.getFullYear() === targetYear;
    });
    
    let totalRevenue = 0;
    let totalHSTCollected = 0;
    let totalServiceAmount = 0;
    
    monthlyBookings.forEach(booking => {
      const breakdown = calculateHSTBreakdown(booking.totalPrice);
      totalRevenue += breakdown.total;
      totalHSTCollected += breakdown.hstAmount;
      totalServiceAmount += breakdown.serviceAmount;
    });
    
    return {
      month: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalHSTCollected: Math.round(totalHSTCollected * 100) / 100,
      totalServiceAmount: Math.round(totalServiceAmount * 100) / 100,
      hstOwedToGovernment: Math.round(totalHSTCollected * 100) / 100, // This is what you owe CRA
      bookingCount: monthlyBookings.length,
      bookings: monthlyBookings
    };
  };

  // Generate professional invoice with HST breakdown
  const generateInvoiceWithHSTBreakdown = (booking) => {
    const invoiceNumber = `INV-${Date.now()}`;
    const hstBreakdown = calculateHSTBreakdown(booking.totalPrice);
    
    return {
      invoiceNumber,
      clientName: booking.clientName,
      email: booking.email,
      phone: booking.phone,
      package: booking.package,
      sessionDate: booking.date,
      sessionTime: booking.time,
      addons: booking.addons || [],
      discount: booking.discount,
      serviceAmount: hstBreakdown.serviceAmount,
      hstAmount: hstBreakdown.hstAmount,
      total: hstBreakdown.total, // This stays the same as booking.totalPrice
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: booking.date,
      status: 'sent',
      createdAt: new Date().toISOString()
    };
  };

  // Download invoice (client pays exactly the package price, no extra)
  // eslint-disable-next-line no-unused-vars
  const downloadInvoiceWithHST = (booking) => {
    const invoice = generateInvoiceWithHSTBreakdown(booking);
    
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #2d3748; }
              .invoice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px; }
              .logo { font-size: 2.5rem; font-weight: bold; color: #f59e0b; }
              .company-info { text-align: right; }
              .invoice-title { font-size: 2rem; font-weight: bold; color: #2d3748; margin-bottom: 30px; }
              .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
              .details-section h3 { color: #f59e0b; margin-bottom: 15px; font-size: 1.2rem; }
              .details-section p { margin: 5px 0; line-height: 1.6; }
              .service-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .service-table th { background: #f59e0b; color: white; padding: 15px; text-align: left; }
              .service-table td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }
              .totals { margin-left: auto; width: 300px; background: #fef7ed; padding: 20px; border-radius: 8px; }
              .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
              .total-row.final { font-weight: bold; font-size: 1.2rem; color: #f59e0b; border-top: 2px solid #f59e0b; padding-top: 15px; }
              .footer { margin-top: 50px; text-align: center; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; }
              .hst-note { background: #fef7ed; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
          </style>
      </head>
      <body>
          <div class="invoice-header">
              <div>
                  <div class="logo">Peridot Images</div>
                  <p style="margin: 5px 0; color: #718096;">Professional Photography Services</p>
              </div>
              <div class="company-info">
                  <p><strong>Peridot Images</strong></p>
                  <p>Barrhaven Studio, Ottawa</p>
                  <p>📧 imagesbyperidot@gmail.com</p>
                  <p>📱 (647) 444-3767</p>
                  <p>📸 @peridotimages</p>
              </div>
          </div>

          <div class="invoice-title">INVOICE ${invoice.invoiceNumber}</div>

          <div class="invoice-details">
              <div class="details-section">
                  <h3>Bill To:</h3>
                  <p><strong>${booking.clientName}</strong></p>
                  <p>📧 ${booking.email}</p>
                  <p>📱 ${booking.phone}</p>
              </div>
              <div class="details-section">
                  <h3>Session Details:</h3>
                  <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><strong>Time:</strong> ${booking.time}</p>
                  <p><strong>Duration:</strong> ${booking.duration}</p>
                  <p><strong>Location:</strong> Barrhaven Studio, Ottawa</p>
              </div>
          </div>

          <table class="service-table">
              <thead>
                  <tr>
                      <th>Description</th>
                      <th>Amount</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td><strong>${booking.package}</strong><br><small>Professional photography session</small></td>
                      <td><strong>$${invoice.total}</strong></td>
                  </tr>
              </tbody>
          </table>

          <div class="totals">
              <div class="total-row">
                  <span>Service Amount:</span>
                  <span>$${invoice.serviceAmount}</span>
              </div>
              <div class="total-row">
                  <span>HST (13%):</span>
                  <span>$${invoice.hstAmount}</span>
              </div>
              <div class="total-row final">
                  <span>Total Amount Due:</span>
                  <span>$${invoice.total}</span>
              </div>
          </div>

          <div class="hst-note">
              <strong>Note:</strong> All quoted prices include HST. No additional taxes will be charged.
          </div>

          <div class="footer">
              <p><strong>Payment Instructions:</strong></p>
              <p>Please send e-transfer to: <strong>alongejoan@gmail.com</strong></p>
              <p>Reference: ${booking.clientName} - Invoice ${invoice.invoiceNumber}</p>
              <p style="margin-top: 20px;">Thank you for choosing Peridot Images!</p>
          </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Peridot-Invoice-${invoice.invoiceNumber}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate monthly HST for admin tracking
  const calculateMonthlyHSTReport = (bookings) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get this month's confirmed bookings
    const thisMonthBookings = bookings.filter(booking => {
      if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') return false;
      const bookingDate = new Date(booking.createdAt);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });
    
    // Calculate totals
    let totalRevenue = 0;
    let totalHSTCollected = 0;
    let totalServiceAmount = 0;
    
    const detailedBookings = thisMonthBookings.map(booking => {
      const breakdown = calculateHSTBreakdown(booking.totalPrice);
      totalRevenue += breakdown.total;
      totalHSTCollected += breakdown.hstAmount;
      totalServiceAmount += breakdown.serviceAmount;
      
      return {
        ...booking,
        hstBreakdown: breakdown
      };
    });
    
    return {
      month: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalHSTCollected: Math.round(totalHSTCollected * 100) / 100,
      totalServiceAmount: Math.round(totalServiceAmount * 100) / 100,
      hstOwedToGovernment: Math.round(totalHSTCollected * 100) / 100, // This is what you owe CRA
      bookingCount: thisMonthBookings.length,
      bookings: detailedBookings
    };
  };

  // Export HST report for CRA
  const exportHSTReport = (bookings) => {
    const report = calculateMonthlyHSTReport(bookings);
    
    const csvData = [
      ['Peridot Images - Monthly HST Report'],
      [`Period: ${report.month}`],
      [''],
      ['SUMMARY FOR CRA:'],
      [`Total Revenue: $${report.totalRevenue}`],
      [`Service Amount: $${report.totalServiceAmount}`],
      [`HST Collected: $${report.totalHSTCollected}`],
      [`Sessions Count: ${report.bookingCount}`],
      [''],
      ['BOOKING DETAILS:'],
      ['Date', 'Client', 'Package', 'Total Price', 'Service Amount', 'HST Collected'],
      ...report.bookings.map(booking => [
        booking.date,
        booking.clientName,
        booking.package,
        `$${booking.hstBreakdown.total}`,
        `$${booking.hstBreakdown.serviceAmount}`,
        `$${booking.hstBreakdown.hstAmount}`
      ])
    ];
    
    const csvContent = csvData.map(row => 
      Array.isArray(row) ? row.join(',') : row
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HST-Report-${report.month.replace(' ', '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Add this helper function below your generateMonthlyCalendar or near other calendar helpers:
  function generateYearCalendar() {
    // Generate 12 months starting from current month
    const today = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const dates = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const dateString = dateObj.toISOString().split('T')[0];
        // Only show weekends (Saturday=6, Sunday=0)
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          const isBlocked = blockedDates.includes(dateString);
          const hasBooking = bookings.some(b => b.date === dateString && b.status !== 'cancelled');
          dates.push({
            date: dateString,
            day,
            dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            isBlocked,
            hasBooking
          });
        }
      }
      months.push({ name: monthName, dates });
    }
    return months;
  }

  // Get all bookings for a specific date
  const getBookingsForDate = (date) => {
    return bookings.filter(booking => 
      booking.date === date && booking.status !== 'cancelled'
    );
  };

  // Get time slots with booking info for a specific date
  const getTimeSlotInfo = (date) => {
    // const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
    const dayOfWeek = new Date(date).getDay();
    
    // Filter times based on day (Saturday/Sunday only)
    const availableTimes = dayOfWeek === 6 ? 
      ['11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'] :
      dayOfWeek === 0 ? 
      ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'] :
      [];

    return availableTimes.map(time => {
      const realBooking = bookings.find(b => b.date === date && b.time === time && b.status !== 'cancelled');
      const isBlocked = blockedTimeSlots[date]?.includes(time);
      const fakeBooking = fakeBookings[date]?.find(fb => fb.time === time);
      
      return {
        time,
        status: realBooking ? 'booked' : isBlocked ? 'blocked' : 'available',
        booking: realBooking,
        fakeBooking: fakeBooking
      };
    });
  };

  // Generate week view data
  const generateWeekView = (startDate) => {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      // Only include weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        week.push({
          date: dateString,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate(),
          timeSlots: getTimeSlotInfo(dateString),
          bookings: getBookingsForDate(dateString)
        });
      }
    }
    return week;
  };

  // Get current week start (find the nearest Saturday)
  const getCurrentWeekStart = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilSaturday = (6 - currentDay) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    return saturday;
  };

  // Discount management functions
  function calculateDiscountStats() {
    const now = new Date();
    let totalCodes = discountCodes.length;
    let activeCodes = discountCodes.filter(dc => dc.isActive && (!dc.expiryDate || new Date(dc.expiryDate) >= now)).length;
    let expiredCodes = discountCodes.filter(dc => dc.expiryDate && new Date(dc.expiryDate) < now).length;
    let totalUsage = bookings.filter(b => b.discount && b.discount.code).length;
    return { totalCodes, activeCodes, expiredCodes, totalUsage };
  }

  function resetDiscountForm() {
    setDiscountFormData({
      code: '',
      type: 'percentage',
      value: '',
      description: '',
      expiryDate: '',
      usageLimit: '',
      isActive: true
    });
  }

  function exportDiscountReport() {
    const rows = [
      ['Code', 'Type', 'Value', 'Description', 'Expiry Date', 'Usage Limit', 'Active', 'Created At', 'Usage Count'],
      ...discountCodes.map(dc => [
        dc.code,
        dc.type,
        dc.value,
        dc.description,
        dc.expiryDate || '',
        dc.usageLimit || '',
        dc.isActive ? 'Yes' : 'No',
        dc.createdAt ? new Date(dc.createdAt).toLocaleDateString() : '',
        getBookingsWithDiscount(dc.code).length
      ])
    ];
    const csv = rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'discount-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function updateDiscountCode() {
    try {
      await updateDiscountCode(discountFormData.id, discountFormData);
      setDiscountCodes(prev => prev.map(dc =>
        dc.id === discountFormData.id ? { ...discountFormData, id: discountFormData.id, createdAt: dc.createdAt || new Date().toISOString() } : dc
      ));
      setShowDiscountForm(false);
      setEditingDiscount(null);
      resetDiscountForm();
    } catch (error) {
      console.error('Error updating discount code:', error);
      alert('Error updating discount code. Please try again.');
    }
  }

  async function createDiscountCode() {
    try {
      const discountId = await addDiscountCode(discountFormData);
      const newCode = {
        ...discountFormData,
        id: discountId,
        createdAt: new Date().toISOString(),
      };
      setDiscountCodes(prev => [...prev, newCode]);
      setShowDiscountForm(false);
      setEditingDiscount(null);
      resetDiscountForm();
    } catch (error) {
      console.error('Error creating discount code:', error);
      alert('Error creating discount code. Please try again.');
    }
  }

  function getBookingsWithDiscount(code) {
    return bookings.filter(b => b.discount && b.discount.code === code);
  }

  function startEditingDiscount(discount) {
    setEditingDiscount(discount);
    setDiscountFormData({ ...discount });
    setShowDiscountForm(true);
  }

  async function toggleDiscountStatus(id) {
    try {
      const discount = discountCodes.find(dc => dc.id === id);
      const newStatus = !discount.isActive;
      await updateDiscountCode(id, { isActive: newStatus });
      setDiscountCodes(prev => prev.map(dc =>
        dc.id === id ? { ...dc, isActive: newStatus } : dc
      ));
    } catch (error) {
      console.error('Error toggling discount status:', error);
      alert('Error updating discount status. Please try again.');
    }
  }

  async function deleteDiscountCode(id) {
    if (window.confirm('Are you sure you want to delete this discount code?')) {
      try {
        await deleteDiscountCode(id);
        setDiscountCodes(prev => prev.filter(dc => dc.id !== id));
        if (editingDiscount && editingDiscount.id === id) {
          setEditingDiscount(null);
          resetDiscountForm();
          setShowDiscountForm(false);
        }
      } catch (error) {
        console.error('Error deleting discount code:', error);
        alert('Error deleting discount code. Please try again.');
      }
    }
  }

  // EMAIL AUTOMATION FUNCTIONS
  // Auto-send emails based on booking status changes
  const sendAutomatedEmail = (booking, type) => {
    if (!emailSettings[`auto${type.charAt(0).toUpperCase() + type.slice(1)}`]) return;
    
    const template = emailTemplates[type];
    const personalizedSubject = template.subject
      .replace('{clientName}', booking.clientName)
      .replace('{sessionTime}', booking.time)
      .replace('{sessionDate}', new Date(booking.date).toLocaleDateString('en-CA'));
      
    const personalizedBody = template.body
      .replace(/{clientName}/g, booking.clientName)
      .replace(/{sessionDate}/g, new Date(booking.date).toLocaleDateString('en-CA', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      }))
      .replace(/{sessionTime}/g, booking.time)
      .replace(/{packageName}/g, booking.package);

    const mailtoLink = `mailto:${booking.email}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`;
    window.open(mailtoLink);
  };

  // Send birthday emails to clients
  const sendBirthdayEmails = useCallback(() => {
    const today = new Date();
    const todayString = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    bookings.forEach(booking => {
      if (booking.birthday === todayString && booking.email) {
        const template = emailTemplates.birthday;
        const personalizedSubject = template.subject;
        const personalizedBody = template.body.replace(/{clientName}/g, booking.clientName);
        
        const mailtoLink = `mailto:${booking.email}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`;
        window.open(mailtoLink);
      }
    });
  }, [bookings, emailTemplates]);

  // Check and handle expired bookings
  const checkExpiredBookings = useCallback(() => {
    const now = new Date();
    const expiredBookings = bookings.filter(booking => 
      booking.expiresAt && new Date(booking.expiresAt) < now && booking.status === 'held'
    );
    
    expiredBookings.forEach(booking => {
      // Update booking status to expired
      updateBookingStatus(booking.id, 'expired', 'pending');
      
      // Send cancellation email
      const template = emailTemplates.cancellation;
      const personalizedSubject = template.subject;
      const personalizedBody = template.body
        .replace(/{clientName}/g, booking.clientName)
        .replace(/{packageName}/g, booking.package)
        .replace(/{sessionDate}/g, new Date(booking.date).toLocaleDateString('en-CA', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }))
        .replace(/{sessionTime}/g, booking.time);
      
      const mailtoLink = `mailto:${booking.email}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`;
      window.open(mailtoLink);
    });
  }, [bookings, emailTemplates, updateBookingStatus]);

  // Check for birthdays and expired bookings daily
  React.useEffect(() => {
    const checkDaily = () => {
      sendBirthdayEmails();
      checkExpiredBookings();
    };
    
    // Check once when component mounts
    checkDaily();
    
    // Set up daily check (every 24 hours)
    const interval = setInterval(checkDaily, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [bookings, sendBirthdayEmails, checkExpiredBookings]);

  // Email recovery system for abandoned bookings
  // eslint-disable-next-line no-unused-vars
  const sendAbandonmentEmail = (userData) => {
    const template = `Hi ${userData.name || 'there'}, 

I noticed you were in the middle of booking a ${userData.package} photography session with Peridot Images, but didn't complete your reservation.

Don't worry - your progress has been saved! You can complete your booking in just 2 clicks:

🔗 [Resume Your Booking](https://your-domain.com/resume)

Your selected package: ${userData.package}
Step you reached: ${userData.step}

If you have any questions or need assistance, just reply to this email or call us at (647) 444-3767.

Looking forward to capturing your beautiful moments!

Best regards,
The Peridot Images Team
📧 imagesbyperidot@gmail.com
📱 (647) 444-3767`;

    const mailtoLink = `mailto:${userData.email}?subject=${encodeURIComponent('Complete Your Peridot Images Booking')}&body=${encodeURIComponent(template)}`;
    window.open(mailtoLink);
  };

  // CLIENT MANAGEMENT FUNCTIONS
  // const addClientNote = (clientEmail, note) => {
  //   const timestamp = new Date().toISOString();
  //   setClientNotes(prev => ({
  //     ...prev,
  //     [clientEmail]: [
  //       ...(prev[clientEmail] || []),
  //       { id: Date.now(), note, timestamp, type: 'note' }
  //     ]
  //   }));
  // };

  // const getClientProfile = (clientEmail) => {
  //   const clientBookings = bookings.filter(b => b.email === clientEmail);
  //   const totalSpent = clientBookings
  //     .filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid')
  //     .reduce((sum, b) => sum + b.totalPrice, 0);
    
  //   const notes = clientNotes[clientEmail] || [];
  //   const lastBooking = clientBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
  //   return {
  //     email: clientEmail,
  //     name: lastBooking?.clientName || 'Unknown',
  //     phone: lastBooking?.phone || '',
  //     totalBookings: clientBookings.length,
  //     totalSpent,
  //     notes,
  //     lastBooking: lastBooking?.date || 'Never',
  //     preferredCommunication: lastBooking?.preferredCommunication || 'email',
  //     status: clientBookings.length > 1 ? 'repeat' : 'new'
  //   };
  // };

  // ADVANCED ANALYTICS SYSTEM
  const getAdvancedAnalytics = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Revenue trends
    const last6Months = Array.from({length: 6}, (_, i) => {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate.getMonth() === date.getMonth() && 
               bookingDate.getFullYear() === date.getFullYear() &&
               b.status === 'confirmed' && b.paymentStatus === 'paid';
      });
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: monthBookings.reduce((sum, b) => sum + b.totalPrice, 0),
        bookings: monthBookings.length
      };
    }).reverse();

    // Package popularity
    const packageStats = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((acc, booking) => {
        acc[booking.package] = (acc[booking.package] || 0) + 1;
        return acc;
      }, {});

    // Peak booking times
    const timeSlotStats = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((acc, booking) => {
        acc[booking.time] = (acc[booking.time] || 0) + 1;
        return acc;
      }, {});

    // Conversion rates
    const totalInquiries = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const conversionRate = totalInquiries > 0 ? (confirmedBookings / totalInquiries * 100).toFixed(1) : 0;

    // Average booking value
    const confirmedRevenue = bookings
      .filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const avgBookingValue = confirmedBookings > 0 ? (confirmedRevenue / confirmedBookings).toFixed(0) : 0;

    return {
      last6Months,
      packageStats,
      timeSlotStats,
      conversionRate,
      avgBookingValue,
      totalInquiries,
      confirmedBookings
    };
  };

  // BUSINESS INTELLIGENCE
  const getBusinessInsights = () => {
    const analytics = getAdvancedAnalytics();
    const insights = [];

    // Revenue insights
    if (analytics.last6Months.length >= 2) {
      const currentMonth = analytics.last6Months[analytics.last6Months.length - 1];
      const lastMonth = analytics.last6Months[analytics.last6Months.length - 2];
      const growth = ((currentMonth.revenue - lastMonth.revenue) / (lastMonth.revenue || 1) * 100).toFixed(1);
      
      insights.push({
        type: growth > 0 ? 'positive' : 'negative',
        icon: growth > 0 ? '📈' : '📉',
        title: 'Monthly Revenue Trend',
        message: `${growth}% ${growth > 0 ? 'increase' : 'decrease'} from last month`,
        action: growth < 0 ? 'Consider promotional campaigns' : 'Great momentum!'
      });
    }

    // Package recommendations
    const topPackage = Object.entries(analytics.packageStats)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topPackage) {
      insights.push({
        type: 'info',
        icon: '📦',
        title: 'Most Popular Package',
        message: `${topPackage[0]} (${topPackage[1]} bookings)`,
        action: 'Consider creating similar packages or upselling add-ons'
      });
    }

    // Time slot optimization
    const peakTime = Object.entries(analytics.timeSlotStats)
      .sort((a, b) => b[1] - a[1])[0];
      
    if (peakTime) {
      insights.push({
        type: 'info',
        icon: '⏰',
        title: 'Peak Booking Time',
        message: `${peakTime[0]} is most popular`,
        action: 'Consider premium pricing for peak slots'
      });
    }

    // Conversion optimization
    if (analytics.conversionRate < 70) {
      insights.push({
        type: 'warning',
        icon: '🎯',
        title: 'Conversion Opportunity',
        message: `${analytics.conversionRate}% conversion rate`,
        action: 'Follow up with pending bookings or improve booking flow'
      });
    }

    return insights;
  };

  // QUICK ACTIONS SYSTEM
  const quickActions = [
    {
      id: 'email-today-clients',
      title: 'Email Today\'s Clients',
      icon: '📧',
      action: () => {
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(b => b.date === today && b.status === 'confirmed');
        
        if (todayBookings.length === 0) {
          alert('No confirmed sessions today!');
          return;
        }
        
        todayBookings.forEach(booking => {
          sendAutomatedEmail(booking, 'reminder');
        });
      }
    },
    {
      id: 'tomorrow-prep',
      title: 'Tomorrow\'s Prep',
      icon: '📋',
      action: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const tomorrowBookings = bookings.filter(b => b.date === tomorrowStr && b.status === 'confirmed');
        
        if (tomorrowBookings.length === 0) {
          alert('No sessions tomorrow!');
          return;
        }
        
        const prepList = tomorrowBookings.map(b => 
          `${b.time} - ${b.clientName} (${b.package})`
        ).join('\n');
        
        alert(`Tomorrow's Sessions:\n\n${prepList}\n\nDon't forget to:\n• Charge camera batteries\n• Prepare studio setup\n• Review client preferences`);
      }
    },
    {
      id: 'weekly-report',
      title: 'Generate Weekly Report',
      icon: '📊',
      action: () => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weekBookings = bookings.filter(b => 
          new Date(b.createdAt) >= weekAgo && b.status === 'confirmed'
        );
        
        const weekRevenue = weekBookings.reduce((sum, b) => sum + b.totalPrice, 0);
        
        const report = `📊 WEEKLY REPORT
        
Period: ${weekAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}

💰 Revenue: $${weekRevenue}
📅 Bookings: ${weekBookings.length}
📈 Avg Value: $${weekBookings.length > 0 ? Math.round(weekRevenue / weekBookings.length) : 0}

Top Package: ${weekBookings.length > 0 ? weekBookings.reduce((acc, b) => {
  acc[b.package] = (acc[b.package] || 0) + 1;
  return acc;
}, {}) : 'None'}`;

        alert(report);
      }
    },
    {
      id: 'backup-data',
      title: 'Backup All Data',
      icon: '💾',
      action: () => {
        const allData = {
          bookings,
          packages: localPackages,
          categories: localCategoryNames,
          discounts: discountCodes,
          timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `peridot-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        alert('✅ Data backup downloaded successfully!');
      }
    }
  ];

  // Add at the top of App function, after useState imports:
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('peridotTheme');
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  const [language, setLanguage] = useState(() => localStorage.getItem('peridotLang') || 'en');

  // Add translations object (English/French)
  const translations = {
    en: {
      welcome: 'Welcome to Your Photography Journey',
      begin: 'Begin Your Booking Experience',
      chooseExperience: 'Choose Your Experience',
      bookSession: 'Book Your Session',
      createMagic: 'Create Magic',
      selectFrom: 'Select from our curated collection of photography experiences',
      chooseDate: 'Choose your perfect date and time with our elegant calendar',
      relax: 'Relax while we capture your most beautiful moments',
      questions: "Questions? We're here to help you every step of the way.",
    },
    fr: {
      welcome: 'Bienvenue dans votre parcours photographique',
      begin: 'Commencez votre expérience de réservation',
      chooseExperience: 'Choisissez votre expérience',
      bookSession: 'Réservez votre séance',
      createMagic: 'Créez de la magie',
      selectFrom: 'Sélectionnez parmi notre collection d\'expériences photographiques',
      chooseDate: 'Choisissez votre date et heure parfaites avec notre calendrier élégant',
      relax: 'Détendez-vous pendant que nous capturons vos plus beaux moments',
      questions: "Des questions ? Nous sommes là pour vous aider à chaque étape.",
    }
  };
  // Helper for translation
  const t = (key) => translations[language][key] || key;

  // Effect: Apply dark mode class to body
  React.useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('peridotTheme', theme);
  }, [theme]);

  // Effect: Save language
  React.useEffect(() => {
    localStorage.setItem('peridotLang', language);
  }, [language]);

  // Effect: Save email settings
  React.useEffect(() => {
    localStorage.setItem('peridotEmailSettings', JSON.stringify(emailSettings));
  }, [emailSettings]);

  // Effect: Save client notes
  React.useEffect(() => {
    localStorage.setItem('peridotClientNotes', JSON.stringify(clientNotes));
  }, [clientNotes]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (currentStep === 'categories') {
      trackPageViewAnalytics('categories');
      trackFunnelStep('categoryViews');
    } else if (currentStep === 'packages') {
      trackPageViewAnalytics('packages');
      trackFunnelStep('packageViews');
    } else if (currentStep === 'clientform') {
      trackPageViewAnalytics('booking-form');
      trackFunnelStep('bookingStarted');
    } else if (currentStep === 'confirmation') {
      trackPageViewAnalytics('confirmation');
      trackFunnelStep('bookingCompleted');
    }
  }, [currentStep]);

  // Save progress automatically
  React.useEffect(() => {
    if (currentStep !== 'welcome') {
      const progress = {
        step: currentStep,
        category: selectedCategory,
        package: selectedPackage,
        addons: selectedAddons,
        date: selectedDate,
        time: selectedTime,
        clientInfo: clientInfo,
        discount: appliedDiscount,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('peridotBookingProgress', JSON.stringify(progress));
      setBookingProgress(progress);
    }
  }, [currentStep, selectedCategory, selectedPackage, selectedAddons, selectedDate, selectedTime, clientInfo, appliedDiscount]);

  // VOICE COMMANDS FOR ACCESSIBILITY
  React.useEffect(() => {
    if ('speechSynthesis' in window && voiceEnabled) {
      const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
      };
      
      // Announce current step
      const stepAnnouncements = {
        'welcome': 'Welcome to Peridot Images booking system',
        'categories': 'Please select your photography session type',
        'packages': 'Choose your preferred package',
        'addons': 'Add optional extras to your package',
        'datetime': 'Select your preferred date and time',
        'clientform': 'Please provide your contact information',
        'payment': 'Review payment instructions',
        'confirmation': 'Booking completed successfully'
      };
      
      if (stepAnnouncements[currentStep]) {
        speak(stepAnnouncements[currentStep]);
      }
    }
  }, [currentStep, voiceEnabled]);

  // Place this helper function inside the App component, before the return statement
  function handleEmailWithPDFAttachment(booking) {
    // Get package details
    const selectedPackage = packages.find(pkg => pkg.name === booking.package);
    const packageDetails = selectedPackage ? selectedPackage.details : [];
    
    // Format addons
    const addonsList = booking.addons && booking.addons.length > 0 
      ? booking.addons.map(addon => `• ${addon.name} (+$${addon.price})`).join('\n')
      : 'None selected';
    
    const subject = `Invoice ${Date.now()} - Your Peridot Images Session`;
    const body = [
      `Dear ${booking.clientName},`,
      '',
      'Thank you for booking with Peridot Images! Please find attached your detailed session information and invoice.',
      '',
      '📋 BOOKING CONFIRMATION:',
      `Invoice Number: INV-${Date.now()}`,
      `Session Date: ${new Date(booking.date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      `Session Time: ${booking.time}`,
      `Duration: ${booking.duration || 'Standard session duration'}`,
      '',
      '📸 YOUR PACKAGE DETAILS:',
      `Package: ${booking.package}`,
      ...packageDetails.map(detail => `• ${detail}`),
      '',
      '🎁 SELECTED ADD-ONS:',
      addonsList,
      '',
      '💰 PAYMENT BREAKDOWN:',
      `Total Amount: $${booking.totalPrice} (HST included)`,
      '',
      '💳 PAYMENT INSTRUCTIONS:',
      'Please send e-transfer to: alongejoan@gmail.com',
      `Reference: ${booking.clientName} - Session ${booking.date}`,
      '',
      '📍 SESSION LOCATION:',
      'Barrhaven Studio, Ottawa',
      '',
      '📞 IMPORTANT: SHOOTING PLAN CONTACT',
      'I will contact you approximately 1 week before your session to discuss your shooting plan, preferences, and any specific ideas you have for your photos. This ensures we create exactly what you envision!',
      '',
      '🔔 WHAT TO EXPECT:',
      '1. Complete payment via e-transfer using the details above',
      '2. I\'ll reach out 1 week before your session to plan your shoot',
      '3. You\'ll receive a session preparation guide 48 hours before your appointment',
      '4. Your beautifully edited photos will be delivered within 7-10 business days after you select your favorites',
      '',
      'Thank you for choosing Peridot Images!',
      '',
      'Best regards,',
      'The Peridot Images Team',
      '',
      '📧 imagesbyperidot@gmail.com',
      '📱 (647) 444-3767',
      '📸 @peridotimages',
      '🌐 Barrhaven Studio, Ottawa'
    ].join('\n');

    const mailtoLink = `mailto:${booking.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    setTimeout(() => {
      downloadInvoice(booking);
      alert('💡 Instructions:\n1. Save the PDF invoice that just opened\n2. Attach it to the email that opened\n3. Send the email to your client');
    }, 500);
  }

  // Resume booking banner
  const ResumeBookingBanner = () => (
    bookingProgress && currentStep === 'welcome' && (
      <div className="resume-booking-banner">
        <div className="resume-content">
          <h4>📋 Resume Your Booking</h4>
          <p>You have an incomplete booking from {new Date(bookingProgress.timestamp).toLocaleDateString()}</p>
          <div className="resume-actions">
            <button 
              onClick={() => {
                setCurrentStep(bookingProgress.step);
                setSelectedCategory(bookingProgress.category);
                setSelectedPackage(bookingProgress.package);
                setSelectedAddons(bookingProgress.addons || []);
                setSelectedDate(bookingProgress.date || '');
                setSelectedTime(bookingProgress.time || '');
                setClientInfo(bookingProgress.clientInfo || {});
                setAppliedDiscount(bookingProgress.discount);
              }}
              className="resume-button"
            >
              Continue Booking
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('peridotBookingProgress');
                setBookingProgress(null);
              }}
              className="clear-button"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    )
  );

  const checkWeatherForDate = async (date) => {
    // You can integrate with a weather API like OpenWeatherMap
    // For now, this is a placeholder
    const isOutdoorSession = selectedPackage?.location?.includes('Outdoor');
    
    if (isOutdoorSession && date) {
      // Simulate weather check
      const weatherTypes = ['sunny', 'cloudy', 'rainy', 'snowy'];
      const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      
      setWeatherData({
        date: date,
        condition: randomWeather,
        temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
        recommendation: randomWeather === 'rainy' ? 'Consider rescheduling or indoor backup' : 'Perfect for outdoor photos!'
      });
    }
  };

  const WeatherAlert = () => (
    weatherData && selectedPackage?.location?.includes('Outdoor') && (
      <div className={`weather-alert ${weatherData.condition}`}>
        <h4>🌤️ Weather Forecast for Your Session</h4>
        <div className="weather-info">
          <span>📅 {formatDateLong(weatherData.date)}</span>
          <span>🌡️ {weatherData.temperature}°C</span>
          <span>☁️ {weatherData.condition}</span>
        </div>
        <p className="weather-recommendation">{weatherData.recommendation}</p>
      </div>
    )
  );

  // SOCIAL PROOF COMPONENT
  const SocialProof = () => {
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    
    // Get all reviews and shuffle them for variety - use useMemo to prevent constant re-shuffling
    const displayReviews = useMemo(() => {
      const allReviews = reviews.length > 0 ? reviews : [];
      // Use a stable sort to prevent constant re-shuffling
      const stableReviews = [...allReviews].sort((a, b) => a.id.localeCompare(b.id));
      return stableReviews.slice(0, 6); // Show up to 6 reviews
    }, [reviews.length]); // Only re-shuffle when reviews array length changes
    
    const reviewStats = getReviewStats();
    
    // Auto-play carousel
    useEffect(() => {
      if (!isAutoPlaying || displayReviews.length <= 1) return;
      
      const interval = setInterval(() => {
        setCurrentReviewIndex((prev) => (prev + 1) % displayReviews.length);
      }, 4000); // Change every 4 seconds
      
      return () => clearInterval(interval);
    }, [isAutoPlaying, displayReviews.length]);
    
    // Pause auto-play on hover
    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);
    
    const nextReview = () => {
      setCurrentReviewIndex((prev) => (prev + 1) % displayReviews.length);
    };
    
    const prevReview = () => {
      setCurrentReviewIndex((prev) => (prev - 1 + displayReviews.length) % displayReviews.length);
    };
    
    const goToReview = (index) => {
      setCurrentReviewIndex(index);
    };
    
    if (displayReviews.length === 0) {
      return null; // Don't show section if no reviews
    }
    
    // Reset index if it's out of bounds
    if (currentReviewIndex >= displayReviews.length) {
      setCurrentReviewIndex(0);
    }
    
    return (
      <div className="social-proof-section">
        <h3>⭐ What Our Clients Say</h3>
        
        {/* Dynamic Carousel */}
        <div 
          className="testimonials-carousel-container"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="carousel-controls">
            <button 
              onClick={prevReview}
              className="carousel-btn prev"
              aria-label="Previous review"
            >
              ‹
            </button>
            <button 
              onClick={nextReview}
              className="carousel-btn next"
              aria-label="Next review"
            >
              ›
            </button>
          </div>
          
          <div className="testimonials-carousel">
            {displayReviews.map((review, index) => (
              <div 
                key={review.id} 
                className={`testimonial-card ${index === currentReviewIndex ? 'active' : ''}`}
                style={{
                  transform: `translateX(${(index - currentReviewIndex) * 100}%)`,
                  opacity: index === currentReviewIndex ? 1 : 0.3
                }}
              >
                <div className="stars">
                  {'⭐'.repeat(review.rating)}
                </div>
                <p className="review-text">"{review.text}"</p>
                <div className="testimonial-author">
                  <strong>{review.name}</strong>
                  <span className="package-name">{review.package}</span>
                  {review.verified && <span className="verified-badge">✓ Verified</span>}
                  {review.featured && <span className="featured-badge">⭐ Featured</span>}
                </div>
              </div>
            ))}
          </div>
          
          {/* Carousel Indicators */}
          {displayReviews.length > 1 && (
            <div className="carousel-indicators">
              {displayReviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToReview(index)}
                  className={`indicator ${index === currentReviewIndex ? 'active' : ''}`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Review Statistics */}
        <div className="social-stats">
          <div className="stat">
            <strong>{reviewStats.totalReviews}+</strong>
            <span>Happy Clients</span>
          </div>
          <div className="stat">
            <strong>{reviewStats.averageRating}/5</strong>
            <span>Average Rating</span>
          </div>
          <div className="stat">
            <strong>100%</strong>
            <span>Satisfaction Rate</span>
          </div>
        </div>
        
        {/* Auto-play Toggle */}
        {displayReviews.length > 1 && (
          <div className="carousel-controls-bottom">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`auto-play-toggle ${isAutoPlaying ? 'active' : ''}`}
              aria-label={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
            >
              {isAutoPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Track page views and user journey
  const trackPageViewAnalytics = useCallback((page) => {
    if (!currentSession) return;
    
    const pageView = {
      page,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    setCurrentSession(prev => ({
      ...prev,
      pageViews: [...prev.pageViews, pageView]
    }));
    
    setVisitorAnalytics(prev => ({
      ...prev,
      pageViews: prev.pageViews + 1
    }));
  }, [currentSession]);

  const VoiceControls = () => (
    <div className="voice-controls">
      <button
        onClick={() => setVoiceEnabled(!voiceEnabled)}
        className={`voice-toggle ${voiceEnabled ? 'active' : ''}`}
        aria-label="Toggle voice assistance"
      >
        {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
      </button>
    </div>
  );

  React.useEffect(() => {
    initializeVisitorSession();
    trackPageViewAnalytics('welcome');
    getUserLocation();
    detectUserDevice();
  }, []); // Keep this separate from admin-specific logic

  // Separate useEffect for admin real-time subscriptions
  React.useEffect(() => {
    if (isAdminAuthenticated) {
      console.log('Setting up admin real-time subscriptions...');
      
      // Set up real-time booking listener
      const unsubscribeBookings = subscribeToBookings((updatedBookings) => {
        console.log('Real-time booking update received:', updatedBookings.length, 'bookings');
        setBookings(updatedBookings);
      });
      
      // Set up real-time notification listener
      const unsubscribeNotifications = subscribeToNotifications((updatedNotifications) => {
        console.log('Real-time notification update received:', updatedNotifications.length, 'notifications');
        setAdminNotifications(updatedNotifications);
      });
      
      // Cleanup function
      return () => {
        console.log('Cleaning up admin real-time subscriptions...');
        unsubscribeBookings();
        unsubscribeNotifications();
      };
    }
  }, [isAdminAuthenticated]);

  // Auto-save analytics
  React.useEffect(() => {
    localStorage.setItem('peridotVisitorAnalytics', JSON.stringify(visitorAnalytics));
  }, [visitorAnalytics]);

  // Initialize visitor session
  const initializeVisitorSession = () => {
    const sessionId = localStorage.getItem('peridotSessionId');
    const isNewSession = !sessionId || Date.now() - parseInt(sessionId) > 30 * 60 * 1000; // 30 min session timeout
    
    const session = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      isNewVisitor: isNewSession,
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      pageViews: []
    };
    
    setCurrentSession(session);
    localStorage.setItem('peridotSessionId', session.id);
    
    // Update visitor counts
    setVisitorAnalytics(prev => ({
      ...prev,
      totalVisitors: prev.totalVisitors + 1,
      uniqueVisitors: isNewSession ? prev.uniqueVisitors + 1 : prev.uniqueVisitors,
      pageViews: prev.pageViews + 1,
      conversionFunnel: {
        ...prev.conversionFunnel,
        visitors: prev.conversionFunnel.visitors + 1
      }
    }));
    
    // Track daily stats
    const today = new Date().toISOString().split('T')[0];
    setVisitorAnalytics(prev => ({
      ...prev,
      dailyStats: {
        ...prev.dailyStats,
        [today]: {
          visitors: (prev.dailyStats[today]?.visitors || 0) + 1,
          pageViews: (prev.dailyStats[today]?.pageViews || 0) + 1
        }
      }
    }));
  };

  // Get user location using IP geolocation
  const getUserLocation = async () => {
    try {
      // Using a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/');
      const locationData = await response.json();
      
      const location = {
        country: locationData.country_name,
        region: locationData.region,
        city: locationData.city,
        postalCode: locationData.postal,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timezone: locationData.timezone,
        isp: locationData.org
      };
      
      setUserLocation(location);
      
      // Update location analytics
      const locationKey = `${location.city}, ${location.region}, ${location.country}`;
      setVisitorAnalytics(prev => ({
        ...prev,
        locations: {
          ...prev.locations,
          [locationKey]: (prev.locations[locationKey] || 0) + 1
        }
      }));
      
    } catch (error) {
              // console.log('Could not get location data'); // Removed for production
      
      // Fallback: try to get location from browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: 'browser'
            });
          },
          (error) => {
            // console.log('Geolocation denied or failed'); // Removed for production
          }
        );
      }
    }
  };

  // Detect user device and browser
  const detectUserDevice = () => {
    const userAgent = navigator.userAgent;
    
    // Device detection
    let device = 'Desktop';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      device = /iPad/.test(userAgent) ? 'Tablet' : 'Mobile';
    }
    
    // Browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Update analytics
    setVisitorAnalytics(prev => ({
      ...prev,
      devices: {
        ...prev.devices,
        [device]: (prev.devices[device] || 0) + 1
      },
      browsers: {
        ...prev.browsers,
        [browser]: (prev.browsers[browser] || 0) + 1
      },
      referrers: {
        ...prev.referrers,
        [document.referrer || 'Direct']: (prev.referrers[document.referrer || 'Direct'] || 0) + 1
      }
    }));
  };

  // Track conversion funnel
  const trackFunnelStep = (step) => {
    setVisitorAnalytics(prev => ({
      ...prev,
      conversionFunnel: {
        ...prev.conversionFunnel,
        [step]: prev.conversionFunnel[step] + 1
      }
    }));
  };

  // Get marketing insights
  const getMarketingInsights = () => {
    const totalVisitors = visitorAnalytics.totalVisitors;
    const completedBookings = visitorAnalytics.conversionFunnel.bookingCompleted;
    const conversionRate = totalVisitors > 0 ? ((completedBookings / totalVisitors) * 100).toFixed(2) : 0;
    
    // Top locations
    const topLocations = Object.entries(visitorAnalytics.locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Top referrers
    const topReferrers = Object.entries(visitorAnalytics.referrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Device breakdown
    const deviceStats = visitorAnalytics.devices;
    
    // Last 7 days stats
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      return {
        date: dateStr,
        visitors: visitorAnalytics.dailyStats[dateStr]?.visitors || 0,
        pageViews: visitorAnalytics.dailyStats[dateStr]?.pageViews || 0
      };
    }).reverse();
    
    return {
      totalVisitors,
      conversionRate,
      topLocations,
      topReferrers,
      deviceStats,
      last7Days,
      funnelData: visitorAnalytics.conversionFunnel
    };
  };

  // Export analytics data
  const exportAnalyticsData = () => {
    const csvData = [
      ['Peridot Images - Visitor Analytics Report'],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [''],
      ['SUMMARY:'],
      [`Total Visitors: ${visitorAnalytics.totalVisitors}`],
      [`Unique Visitors: ${visitorAnalytics.uniqueVisitors}`],
      [`Page Views: ${visitorAnalytics.pageViews}`],
      [''],
      ['LOCATIONS:'],
      ['Location', 'Visitors'],
      ...Object.entries(visitorAnalytics.locations).map(([location, count]) => [location, count])
    ];
    
    const csvContent = csvData.map(row => 
      Array.isArray(row) ? row.join(',') : row
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Smart timing triggers for abandonment detection
  // eslint-disable-next-line no-unused-vars
  const trackAbandonmentRisk = () => {
    // Detect when user is about to leave
    // Trigger smart popups or save progress
    // Your app already has auto-save, so this just enhances it
    
    const abandonmentData = localStorage.getItem('peridotAbandonment');
    if (abandonmentData) {
      const data = JSON.parse(abandonmentData);
      const timeSinceLastActivity = new Date() - new Date(data.timestamp);
      
      // If user was active in last 5 minutes and has progress, show recovery popup
      if (timeSinceLastActivity < 5 * 60 * 1000 && data.step !== 'welcome') {
        return {
          shouldShowRecovery: true,
          userData: data,
          timeSinceActivity: timeSinceLastActivity
        };
      }
    }
    
    return { shouldShowRecovery: false };
  };

  // Real-time visitor display for admin
  const LiveVisitorInfo = () => (
    userLocation && (
      <div className="live-visitor-info">
        <h4>🌍 Current Visitor</h4>
        <div className="visitor-details">
          <p>📍 {userLocation.city}, {userLocation.region}, {userLocation.country}</p>
          <p>🌐 {currentSession?.language}</p>
          <p>📱 {Object.keys(visitorAnalytics.devices).find(device => 
            visitorAnalytics.devices[device] === Math.max(...Object.values(visitorAnalytics.devices))
          )}</p>
          <p>⏰ {userLocation.timezone}</p>
        </div>
      </div>
    )
  );

  // Review Management State
  const [reviews, setReviews] = useState(() => {
    const savedReviews = localStorage.getItem('peridotReviews');
    return savedReviews ? JSON.parse(savedReviews) : [
      {
        id: 1,
        name: "Sarah M.",
        rating: 5,
        text: "Absolutely stunning photos! The team was professional and made us feel so comfortable.",
        package: "Family Standard",
        date: "2024-01-15",
        verified: true,
        featured: true
      },
      {
        id: 2,
        name: "Jennifer L.", 
        rating: 5,
        text: "Best investment for our maternity photos. The quality is incredible!",
        package: "Maternity Premium",
        date: "2024-01-10",
        verified: true,
        featured: true
      },
      {
        id: 3,
        name: "Mark T.",
        rating: 5,
        text: "Professional headshots that landed me my dream job. Highly recommend!",
        package: "Professional Premium",
        date: "2024-01-05",
        verified: true,
        featured: false
      }
    ];
  });

  const [editingReview, setEditingReview] = useState(null);
  const [newReview, setNewReview] = useState({
    name: '',
    rating: 5,
    text: '',
    package: '',
    verified: false,
    featured: false
  });
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Review Management Functions
  const addReview = () => {
    if (!newReview.name || !newReview.text || !newReview.package) {
      alert('Please fill in all required fields');
      return;
    }

    const review = {
      id: Date.now(),
      ...newReview,
      date: new Date().toISOString().split('T')[0]
    };

    setReviews(prev => {
      const updatedReviews = [...prev, review];
      localStorage.setItem('peridotReviews', JSON.stringify(updatedReviews));
      return updatedReviews;
    });

    setNewReview({
      name: '',
      rating: 5,
      text: '',
      package: '',
      verified: false,
      featured: false
    });
  };

  const updateReview = (id) => {
    if (!editingReview.name || !editingReview.text || !editingReview.package) {
      alert('Please fill in all required fields');
      return;
    }

    setReviews(prev => {
      const updatedReviews = prev.map(review => 
        review.id === id ? { ...editingReview, id } : review
      );
      localStorage.setItem('peridotReviews', JSON.stringify(updatedReviews));
      return updatedReviews;
    });

    setEditingReview(null);
  };

  const deleteReview = (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      setReviews(prev => {
        const updatedReviews = prev.filter(review => review.id !== id);
        localStorage.setItem('peridotReviews', JSON.stringify(updatedReviews));
        return updatedReviews;
      });
    }
  };

  const toggleReviewFeatured = (id) => {
    setReviews(prev => {
      const updatedReviews = prev.map(review => 
        review.id === id ? { ...review, featured: !review.featured } : review
      );
      localStorage.setItem('peridotReviews', JSON.stringify(updatedReviews));
      return updatedReviews;
    });
  };

  const toggleReviewVerified = (id) => {
    setReviews(prev => prev.map(review => 
      review.id === id 
        ? { ...review, verified: !review.verified }
        : review
    ));
  };

  // eslint-disable-next-line no-unused-vars
  const startEditingReview = (review) => {
    setEditingReview({ ...review });
  };

  // eslint-disable-next-line no-unused-vars
  const cancelEditingReview = () => {
    setEditingReview(null);
  };

  // Get featured reviews for display
  // eslint-disable-next-line no-unused-vars
  const getFeaturedReviews = () => {
    return reviews.filter(review => review.featured).slice(0, 3);
  };

  // Calculate review statistics
  const getReviewStats = () => {
    if (reviews.length === 0) return { totalReviews: 0, averageRating: 0 };
    
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / totalReviews).toFixed(1);
    
    return { totalReviews, averageRating };
  };

  // Add notification state for admin
  const [adminNotifications, setAdminNotifications] = useState(() => {
    const saved = localStorage.getItem('peridotAdminNotifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Add notification display state
  const [showNotifications, setShowNotifications] = useState(false);

  // Save notifications to localStorage
  React.useEffect(() => {
    localStorage.setItem('peridotAdminNotifications', JSON.stringify(adminNotifications));
  }, [adminNotifications]);

  // Add notification function
  const addAdminNotification = (type, message, data = {}) => {
    const notification = {
      id: Date.now(),
      type, // 'booking', 'payment', 'expired', etc.
      message,
      data,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    setAdminNotifications(prev => [notification, ...prev]);
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Peridot Images - New Booking', {
        body: message,
        icon: '/logo192.png'
      });
    }
  };

  // Mark notification as read
  const markNotificationRead = (notificationId) => {
    setAdminNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setAdminNotifications([]);
  };

  // Show loading screen while Firebase data is being loaded
  if (loading) {
    return (
      <div className="luxury-container">
        <div className="luxury-background">
          <div className="loading-screen">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <h2>Loading Peridot Images...</h2>
              <p>Connecting to our booking system</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="luxury-container">
      <div className="luxury-background">
        {/* Theme & Language Controls */}
        <div className="theme-controls">
          <button
            className="theme-toggle-button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button
            className="language-toggle-button"
            onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
            aria-label={language === 'en' ? 'Passer en français' : 'Switch to English'}
          >
            {language === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
          </button>
        </div>

        {/* AI Booking Assistant */}
        <div className="ai-assistant-bubble">
          <div className="ai-assistant-icon">💬</div>
          <div className="ai-assistant-tooltip">
            Need help choosing a package?
          </div>
        </div>

        {/* Voice Controls */}
        <VoiceControls />

        {/* Welcome Screen */}
        {currentStep === 'welcome' && currentView === 'client' && (
          <>
            {/* Resume Booking Banner */}
            <ResumeBookingBanner />

            <header className="luxury-header">
              <div className="fade-in">
                <div className="luxury-logo">
                  <div className="logo-circle">
                    <span className="logo-text">P</span>
                  </div>
                </div>
                <h1 className="main-title">Peridot Images</h1>
                <p className="subtitle">Capturing Life's Most Precious Moments</p>
                <p className="description">
                  Experience luxury photography in Ottawa's most elegant studio space. 
                  Where every moment becomes a timeless masterpiece.
                </p>
              </div>
            </header>

            <div className="luxury-card-container">
              <div className="luxury-card">
                <h2 className="card-title">{t('welcome')}</h2>
                <p className="card-description">
                  {language === 'en'
                    ? "Let us create beautiful memories together. Our luxury booking experience makes it effortless to schedule your perfect photography session."
                    : "Créons ensemble de beaux souvenirs. Notre expérience de réservation de luxe facilite la planification de votre séance photo parfaite."}
                </p>
                <div className="features-grid">
                  <div className="feature-item">
                    <div className="feature-icon">📸</div>
                    <h3 className="feature-title">{t('chooseExperience')}</h3>
                    <p className="feature-description">{t('selectFrom')}</p>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">📅</div>
                    <h3 className="feature-title">{t('bookSession')}</h3>
                    <p className="feature-description">{t('chooseDate')}</p>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">✨</div>
                    <h3 className="feature-title">{t('createMagic')}</h3>
                    <p className="feature-description">{t('relax')}</p>
                  </div>
                </div>
                <button 
                  className="luxury-button"
                  onClick={() => setCurrentStep('categories')}
                >
                  {t('begin')}
                </button>
                <div className="help-text">
                  <p>{t('questions')}</p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <SocialProof />

            <footer className="luxury-footer">
              <div className="footer-content">
                <p>📧 imagesbyperidot@gmail.com | 📱 (647) 444-3767</p>
                <p>📍 Barrhaven Studio, Ottawa</p>
                <p>Follow us: <span className="instagram-handle">@peridotimages</span></p>
              </div>
            </footer>
          </>
        )}

        {/* Category Selection */}
        {currentStep === 'categories' && (
          <>
            <header className="step-header">
              <h2 className="step-title">Choose Your Photography Experience</h2>
              <p className="step-subtitle">Select the perfect service to capture your most precious moments</p>
            </header>

            <div className="categories-grid">
              {Object.entries(localCategoryNames).map(([key, name]) => {
                const categoryPackages = localPackages[key];
                const minPrice = categoryPackages && Array.isArray(categoryPackages) ? 
                  Math.min(...categoryPackages.map(p => typeof p.price === 'number' ? p.price : Infinity)) : 
                  'Contact';
                
                return (
                  <div key={key} className="category-card-wrapper">
                    <div 
                      className={`category-card ${key === 'family' ? 'popular' : ''}`}
                      onClick={() => selectCategory(key)}
                    >
                      {key === 'family' && (
                        <div className="popular-badge">
                          ✨ Most Popular
                        </div>
                      )}
                      
                      <div className="category-content">
                        <h3 className="category-name">{name}</h3>
                        <div className="category-price">
                          {minPrice === 'Contact' || minPrice === Infinity ? 'Contact for Pricing' : `Starting at $${minPrice}`}
                        </div>
                        <div className="category-cta">
                          <span className="cta-button">View Packages</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="alternative-contact">
              <p className="alt-text">Can't find a suitable date in our calendar?</p>
            <button 
              onClick={() => {
                  const mailtoLink = 'mailto:imagesbyperidot@gmail.com?subject=Alternative Date Request&body=Hi, I cannot find a suitable date in your calendar. Can you help me find an alternative time slot?';
                  window.location.href = mailtoLink;
                }}
                className="alt-button"
              >
                Contact Us for Alternative Dates
            </button>
            </div>

            <div className="back-to-welcome">
              <button
                onClick={() => setCurrentStep('welcome')}
                className="back-button"
              >
                ← Back to Welcome
              </button>
            </div>
          </>
        )}

        {/* Package Selection */}
        {currentStep === 'packages' && selectedCategory && (
          <div className="package-selection">
            <header className="step-header">
              <button
                onClick={() => setCurrentStep('categories')}
                className="back-button"
              >
                ← Back to Categories
              </button>
              <h2 className="step-title">{localCategoryNames[selectedCategory]}</h2>
            </header>
            
            <div className="packages-grid">
              {localPackages[selectedCategory] && localPackages[selectedCategory].map((pkg) => (
                <div key={pkg.id} className="package-card">
                  <div className="package-header">
                    <h3 className="package-name">{pkg.name}</h3>
                    <span className="package-price">
                      {typeof pkg.price === 'number' ? `$${pkg.price}` : pkg.price}
                    </span>
                  </div>
                  
                  <div className="package-details">
                    <div className="detail-item">⏱️ Duration: {pkg.duration}</div>
                    <div className="detail-item">👥 People: {pkg.people}</div>
                    <div className="detail-item">👔 Outfits: {pkg.outfits}</div>
                    <div className="detail-item">🎬 Backdrops: {pkg.backdrops}</div>
                    <div className="detail-item">📸 Images: {pkg.images}</div>
                    <div className="detail-item">📍 Location: {pkg.location}</div>
                    {pkg.special && <div className="detail-special">✨ {pkg.special}</div>}
                    {pkg.note && <div className="detail-note">📝 {pkg.note}</div>}
                  </div>
                  
                  <button 
                    className="select-package-button"
                    onClick={() => selectPackage(pkg)}
                  >
                    Select This Package
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons Selection */}
        {currentStep === 'addons' && selectedPackage && (
          <div className="addons-selection">
            <header className="step-header">
              <button
                onClick={() => setCurrentStep('packages')}
                className="back-button"
              >
                ← Back to Packages
              </button>
              <h2 className="step-title">Add-ons & Extras</h2>
              <p className="step-subtitle">Enhance your photography experience with these luxury add-ons</p>
            </header>

            <div className="selected-package-summary">
              <h3 className="summary-title">Selected Package</h3>
              <div className="summary-content">
                <span className="summary-name">{selectedPackage.name}</span>
                <span className="summary-price">${selectedPackage.price}</span>
              </div>
            </div>

            <div className="addons-grid">
              {addons.map((addon) => {
                const isSelected = selectedAddons.find(a => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    className={`addon-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleAddon(addon)}
                  >
                    <div className="addon-header">
                      <h4 className="addon-name">{addon.name}</h4>
                      <span className="addon-price">+${addon.price}</span>
                    </div>
                    <p className="addon-description">{addon.description}</p>
                    {isSelected && (
                      <div className="addon-selected-indicator">
                        ✓ Added to your order
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="discount-section">
              <h3 className="discount-title">Discount Code</h3>
              <div className="discount-input-group">
                <input
                  type="text"
                  placeholder="Enter discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  className="discount-input"
                />
                <button
                  onClick={() => applyDiscountCode(discountCode)}
                  className="apply-discount-button"
                >
                  Apply Discount
                </button>
              </div>
              
              {appliedDiscount && (
                <div className="applied-discount">
                  <div className="discount-info">
                    <span className="discount-code">{appliedDiscount.code}</span>
                    <p className="discount-description">{appliedDiscount.description}</p>
                  </div>
                  <button
                    onClick={removeDiscount}
                    className="remove-discount-button"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="order-summary">
              <h3 className="summary-title">Order Summary</h3>
              <div className="summary-items">
                <div className="summary-item">
                  <span>{selectedPackage.name}</span>
                  <span>${selectedPackage.price}</span>
                </div>
                {selectedAddons.map((addon) => (
                  <div key={addon.id} className="summary-item addon-item">
                    <span>{addon.name}</span>
                    <span>+${addon.price}</span>
                  </div>
                ))}
                {appliedDiscount && (
                  <div className="summary-item discount-item">
                    <span>{appliedDiscount.description}</span>
                    <span>
                      {appliedDiscount.type === 'percentage' && `-${appliedDiscount.value}%`}
                      {appliedDiscount.type === 'fixed' && `-$${appliedDiscount.value}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="summary-total">
                <div className="total-row">
                  <span className="total-label">Total:</span>
                  <span className="total-amount">${calculateTotal()}</span>
                </div>
              </div>
            </div>

            <div className="step-navigation">
              <button
                onClick={() => setCurrentStep('packages')}
                className="nav-button secondary"
              >
                Back to Packages
              </button>
              <button
                onClick={() => setCurrentStep('datetime')}
                className="nav-button primary"
              >
                Continue to Date & Time
              </button>
            </div>
          </div>
        )}

        {/* Date & Time Selection */}
        {currentStep === 'datetime' && (
          <div className="datetime-selection">
            <header className="step-header">
              <button
                onClick={() => setCurrentStep('addons')}
                className="back-button"
              >
                ← Back to Add-ons
              </button>
              <h2 className="step-title">Select Date & Time</h2>
              <p className="step-subtitle">Choose your perfect appointment time • Weekends Only</p>
            </header>
            
            <div className="beautiful-calendar">
              {/* IMPROVED Month Navigation with Clear Date Display */}
              <div className="month-navigation">
                <button
                  onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
                  disabled={currentMonth === 0}
                  className={`month-nav-btn ${currentMonth === 0 ? 'disabled' : ''}`}
                >
                  ← Previous
                </button>
                
                <div className="current-month-display">
                  <h3 className="current-month-title">
                    {monthlyCalendar[currentMonth]?.name}
                  </h3>
                  <p className="current-month-subtitle">
                    {monthlyCalendar[currentMonth]?.dates.length || 0} available dates
                  </p>
                </div>
                
                <button
                  onClick={() => setCurrentMonth(Math.min(monthlyCalendar.length - 1, currentMonth + 1))}
                  disabled={currentMonth === monthlyCalendar.length - 1}
                  className={`month-nav-btn ${currentMonth === monthlyCalendar.length - 1 ? 'disabled' : ''}`}
                >
                  Next →
                </button>
              </div>

              <div className="calendar-content">
                {/* Available Dates for Current Month */}
                <div className="month-dates-section">
                  <h4 className="section-title">Available Weekend Dates</h4>
                  <p className="section-subtitle">
                    {monthlyCalendar[currentMonth]?.dates.length || 0} dates available this month
                  </p>
                  
                  <div className="beautiful-dates-grid">
                    {monthlyCalendar[currentMonth]?.dates.map((dateObj) => (
                      <button
                        key={dateObj.date}
                        onClick={() => {
                          setSelectedDate(dateObj.date);
                          checkWeatherForDate(dateObj.date);
                        }}
                        className={`beautiful-date-card ${selectedDate === dateObj.date ? 'selected' : ''}`}
                      >
                        <div className="date-number">{dateObj.day}</div>
                        <div className="date-day-name">{dateObj.dayName}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weather Alert */}
                <WeatherAlert />

                {/* Time Selection */}
                <div className="times-section">
                  <h4 className="section-title">Available Times</h4>
                  <p className="section-subtitle">
                    {selectedDate ? 
                      `${new Date(selectedDate).getDay() === 6 ? 'Saturday' : 'Sunday'} Schedule` : 
                      'Select a date to see available times'
                    }
                  </p>
                  
                  {selectedDate ? (
                    <div className="beautiful-times-grid">
                      {getAvailableTimesForDate(selectedDate).map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`beautiful-time-card ${selectedTime === time ? 'selected' : ''}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="time-placeholder">
                      <div className="placeholder-icon">⏰</div>
                      <p>Please select a date first</p>
                      <div className="schedule-preview">
                        <div className="schedule-item">
                          <span className="schedule-day">Saturday:</span>
                          <span className="schedule-hours">11:00 AM - 4:00 PM</span>
                        </div>
                        <div className="schedule-item">
                          <span className="schedule-day">Sunday:</span>
                          <span className="schedule-hours">12:00 PM - 4:00 PM</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Appointment Summary */}
            {selectedDate && selectedTime && (
              <div className="beautiful-appointment-summary">
                <div className="summary-header">
                  <h3 className="summary-title">✨ Your Selected Appointment</h3>
                </div>
                
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-icon">📅</div>
                    <div className="summary-details">
                      <div className="summary-label">Date</div>
                      <div className="summary-value">{formatDateLong(selectedDate)}</div>
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <div className="summary-icon">⏰</div>
                    <div className="summary-details">
                      <div className="summary-label">Time</div>
                      <div className="summary-value">{selectedTime}</div>
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <div className="summary-icon">📍</div>
                    <div className="summary-details">
                      <div className="summary-label">Location</div>
                      <div className="summary-value">Barrhaven Studio, Ottawa</div>
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <div className="summary-icon">⏱️</div>
                    <div className="summary-details">
                      <div className="summary-label">Duration</div>
                      <div className="summary-value">{selectedPackage?.duration}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="step-navigation">
              <button
                onClick={() => setCurrentStep('addons')}
                className="nav-button secondary"
              >
                Back to Add-ons
              </button>
              <button
                onClick={() => setCurrentStep('clientform')}
                disabled={!selectedDate || !selectedTime}
                className={`nav-button ${selectedDate && selectedTime ? 'primary' : 'disabled'}`}
              >
                Continue to Client Information
              </button>
            </div>
          </div>
        )}

        {/* Client Information Form */}
        {currentStep === 'clientform' && (
          <div className="client-form-section">
            <header className="step-header">
              <button
                onClick={() => setCurrentStep('datetime')}
                className="back-button"
              >
                ← Back to Date & Time
              </button>
              <h2 className="step-title">Client Information</h2>
              <p className="step-subtitle">Just a few details to complete your luxury booking experience</p>
            </header>

            <div className="client-form-container">
              <div className="form-card">
                <h3 className="form-title">Your Information</h3>
                <p className="form-description">We'll use this information to confirm your booking and keep you updated.</p>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      value={clientInfo.name}
                      onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                      className={`form-input ${formErrors.name ? 'error' : ''}`}
                      placeholder="Enter your full name"
                    />
                    {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                      className={`form-input ${formErrors.email ? 'error' : ''}`}
                      placeholder="your.email@example.com"
                    />
                    {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                      className={`form-input ${formErrors.phone ? 'error' : ''}`}
                      placeholder="(647) 123-4567"
                    />
                    {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Birthday (Optional)</label>
                    <input
                      type="text"
                      value={clientInfo.birthday}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.substring(0, 2) + '-' + value.substring(2, 4);
                        }
                        setClientInfo({...clientInfo, birthday: value});
                      }}
                      maxLength={5}
                      className={`form-input ${formErrors.birthday ? 'error' : ''}`}
                      placeholder="MM-DD (e.g., 03-15)"
                    />
                    <small className="form-help">We'll send you special birthday offers!</small>
                    {formErrors.birthday && <span className="error-message">{formErrors.birthday}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Name for Payment *</label>
                    <input
                      type="text"
                      value={clientInfo.paymentName}
                      onChange={(e) => setClientInfo({...clientInfo, paymentName: e.target.value})}
                      className={`form-input ${formErrors.paymentName ? 'error' : ''}`}
                      placeholder="Name for e-transfer payment"
                    />
                    <small className="form-help">This should match the name on your e-transfer</small>
                    {formErrors.paymentName && <span className="error-message">{formErrors.paymentName}</span>}
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Preferred Communication *</label>
                    <select
                      value={clientInfo.preferredCommunication}
                      onChange={(e) => setClientInfo({...clientInfo, preferredCommunication: e.target.value})}
                      className={`form-input ${formErrors.preferredCommunication ? 'error' : ''}`}
                    >
                      <option value="">Select your preferred method</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone Call</option>
                      <option value="text">Text Message</option>
                    </select>
                    {formErrors.preferredCommunication && <span className="error-message">{formErrors.preferredCommunication}</span>}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    onClick={() => setCurrentStep('datetime')}
                    className="form-button secondary"
                  >
                    Back to Date & Time
                  </button>
                  <button
                    onClick={handleClientFormSubmit}
                    className="form-button primary"
                  >
                    Review Terms & Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Instructions */}
        {currentStep === 'payment' && (
          <div className="payment-section">
            <header className="step-header">
              <h2 className="step-title">Payment Instructions</h2>
              <p className="step-subtitle">You're almost done! Complete your payment to confirm your booking</p>
            </header>

            <div className="payment-container">
              {/* Booking Summary */}
              <div className="booking-summary-card">
                <h3 className="booking-summary-title">📋 Booking Summary</h3>
                
                <div className="booking-details">
                  <div className="booking-detail-item">
                    <span className="detail-label">Service:</span>
                    <span className="detail-value">{selectedPackage.name}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="detail-label">Date & Time:</span>
                    <span className="detail-value">{formatDateLong(selectedDate)} at {selectedTime}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="detail-label">Client:</span>
                    <span className="detail-value">{clientInfo.name}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{clientInfo.email}</span>
                  </div>
                  <div className="booking-detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{clientInfo.phone}</span>
                  </div>
                  
                  {selectedAddons.length > 0 && (
                    <div className="addons-summary">
                      <h4 className="addons-title">Add-ons:</h4>
                      {selectedAddons.map((addon) => (
                        <div key={addon.id} className="addon-summary-item">
                          <span>{addon.name}</span>
                          <span>+${addon.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {appliedDiscount && (
                    <div className="discount-summary">
                      <span className="discount-label">Discount ({appliedDiscount.code}):</span>
                      <span className="discount-value">
                        {appliedDiscount.type === 'percentage' ? `-${appliedDiscount.value}%` : `-${appliedDiscount.value}`}
                      </span>
                    </div>
                  )}
                  
                  <div className="total-summary">
                    <span className="total-label">Total Amount:</span>
                    <span className="total-value">${calculateTotal()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="payment-instructions-card">
                <h3 className="payment-title">💳 E-Transfer Payment</h3>
                
                <div className="payment-steps">
                  <div className="payment-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Send E-Transfer</h4>
                      <p>Send your e-transfer to: <strong className="payment-email">alongejoan@gmail.com</strong></p>
                    </div>
                  </div>
                  
                  <div className="payment-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Payment Amount</h4>
                      <p>Amount: <strong className="payment-amount">${calculateTotal()}</strong></p>
                    </div>
                  </div>
                  
                  <div className="payment-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Payment Reference</h4>
                      <p>Message: <strong className="payment-reference">{clientInfo.name} - {formatDate(selectedDate)}</strong></p>
                    </div>
                  </div>
                  
                  <div className="payment-step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Confirmation</h4>
                      <p>We'll confirm your booking within 24 hours of receiving payment</p>
                    </div>
                  </div>
                </div>

                <div className="payment-notes">
                  <h4 className="notes-title">📝 Important Notes:</h4>
                  <ul className="notes-list">
                    <li>Your session is tentatively held for 4 hours pending payment confirmation</li>
                    <li>Final confirmation will be sent via {clientInfo.preferredCommunication}</li>
                    <li>Session details and preparation guide will follow</li>
                    <li>Photos delivered within 7-10 business days after you have selected and sent them back for editing via secure digital gallery</li>
                    <li>Bookings not confirmed within 4 hours will be automatically cancelled</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="step-navigation">
              <button
                onClick={() => setCurrentStep('clientform')}
                className="nav-button secondary"
              >
                Back to Client Info
              </button>
              <button
                onClick={handleBookingComplete}
                disabled={isSubmitting}
                className="nav-button primary"
              >
                {isSubmitting ? 'Processing...' : 'Payment Sent - Complete Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Confirmation */}
        {currentStep === 'confirmation' && (
          <div className="confirmation-section">
            <div className="confirmation-container">
              <div className="success-animation">
                <div className="success-circle">
                  <div className="success-checkmark">✓</div>
                </div>
              </div>

              <h2 className="confirmation-title">🎉 Booking Held Successfully!</h2>
              <p className="confirmation-subtitle">
                Thank you, {clientInfo.name}! Your session is temporarily held pending payment confirmation.
              </p>

              <div className="confirmation-details">
                <div className="confirmation-card">
                  <h3 className="confirmation-card-title">What Happens Next?</h3>
                  
                  <div className="next-steps">
                    <div className="next-step">
                      <div className="step-icon">⏰</div>
                      <div className="step-text">
                        <strong>Booking Hold</strong>
                        <span>Your session is held for 4 hours pending payment confirmation</span>
                      </div>
                    </div>
                    
                    <div className="next-step">
                      <div className="step-icon">📧</div>
                      <div className="step-text">
                        <strong>Confirmation Email</strong>
                        <span>You'll receive booking confirmation within 24 hours of payment</span>
                      </div>
                    </div>
                    
                    <div className="next-step">
                      <div className="step-icon">📱</div>
                      <div className="step-text">
                        <strong>Session Details</strong>
                        <span>Preparation guide and studio details sent 48 hours before your session</span>
                      </div>
                    </div>
                    
                    <div className="next-step">
                      <div className="step-icon">📸</div>
                      <div className="step-text">
                        <strong>Your Session</strong>
                        <span>{formatDateLong(selectedDate)} at {selectedTime}</span>
                      </div>
                    </div>
                    
                    <div className="next-step">
                      <div className="step-icon">✨</div>
                      <div className="step-text">
                        <strong>Photo Delivery</strong>
                        <span>Beautifully edited images delivered within 7-10 business days after you select your favorites</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="contact-card">
                  <h3 className="contact-card-title">Questions or Changes?</h3>
                  <p>We're here to help make your experience perfect!</p>
                  
                  <div className="contact-methods">
                    <div className="contact-method">
                      <span className="contact-icon">📧</span>
                      <span>imagesbyperidot@gmail.com</span>
                    </div>
                    <div className="contact-method">
                      <span className="contact-icon">📱</span>
                      <span>(647) 444-3767</span>
                    </div>
                    <div className="contact-method">
                      <span className="contact-icon">📍</span>
                      <span>Barrhaven Studio, Ottawa</span>
                    </div>
                    <div className="contact-method">
                      <span className="contact-icon">📸</span>
                      <span>@peridotimages</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="confirmation-actions">
            <button 
              onClick={() => {
                    // Reset all form data for new booking
                    setCurrentStep('welcome');
                    setSelectedCategory('');
                    setSelectedPackage(null);
                    setSelectedAddons([]);
                    setSelectedDate('');
                    setSelectedTime('');
                    setAppliedDiscount(null);
                    setDiscountCode('');
                    setClientInfo({
                      name: '', email: '', phone: '', birthday: '', paymentName: '', preferredCommunication: ''
                    });
                    setFormErrors({});
                    setCurrentMonth(0);
                  }}
                  className="confirmation-button primary"
                >
                  Book Another Session
                </button>
                
                <button
                  onClick={() => window.location.href = 'https://peridotimages.mypixieset.com/faqs/'}
                  className="confirmation-button secondary"
                >
                  View Complete FAQ
            </button>
          </div>
        </div>
      </div>
        )}

        {/* Terms and Conditions Popup */}
        {showTermsPopup && (
          <div className="terms-overlay">
            <div className="terms-popup">
              <div className="terms-header">
                <h3 className="terms-title">Terms & Conditions</h3>
                <button
                  onClick={() => setShowTermsPopup(false)}
                  className="terms-close"
                >
                  ✕
                </button>
              </div>
              
              <div className="terms-content">
                <div className="terms-section">
                  <h4>Booking Policy</h4>
                  <p>All portrait sessions are by appointment and must be booked and scheduled in advance. Full payment is required to confirm your booking.</p>
                </div>
                
                <div className="terms-section">
                  <h4>Session Preparation</h4>
                  <p>We require clients to be prepared in terms of makeup, outfits, and hair up to the client's standards. A preparation guide will be provided.</p>
                </div>
                
                <div className="terms-section">
                  <h4>Image Delivery</h4>
                  <p>Peridot Images will provide the link for selection of images within 48hrs from the session. Final edited images will be delivered within 7-10 working days after you select your favorites.</p>
                </div>
                
                <div className="terms-section">
                  <h4>Copyright and Usage</h4>
                  <p>Peridot Images retains the copyright to all images taken during the session. The client is granted personal usage rights for non-commercial purposes only.</p>
                </div>
                
                <div className="terms-section">
                  <h4>Cancellation & Rescheduling</h4>
                  <p>If you wish to cancel and reschedule 48 hours or earlier, no additional fees apply. Rescheduling within 48 hours will incur additional costs.</p>
                </div>
                
                <div className="terms-footer">
                  <p><strong>For complete FAQs and additional information, visit:</strong></p>
                  <a href="https://peridotimages.mypixieset.com/faqs/" target="_blank" rel="noopener noreferrer" className="faq-link">
                    peridotimages.mypixieset.com/faqs
                  </a>
                </div>
              </div>
              
              <div className="terms-actions">
                <button
                  onClick={() => setShowTermsPopup(false)}
                  className="terms-button secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTermsAccept}
                  className="terms-button primary"
                >
                  I Agree - Continue to Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN LOGIN SCREEN */}
        {currentView === 'admin' && !isAdminAuthenticated && (
          <div className="admin-login-section">
            <div className="admin-login-container">
              <div className="admin-login-card">
                <div className="admin-header">
                  <div className="luxury-logo">
                    <div className="logo-circle">
                      <span className="logo-text">P</span>
                    </div>
                  </div>
                  <h2 className="admin-title">Admin Access</h2>
                  <p className="admin-subtitle">Secure login for Peridot Images team</p>
                </div>

                <div className="admin-form">
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setAdminCredentials({
                        email: 'imagesbyperidot@gmail.com',
                        password: ''
                      })}
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: '#d97706'
                      }}
                    >
                      Fill Email
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setAdminCredentials({
                        ...adminCredentials,
                        password: 'peridot2025'
                      })}
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: '#d97706'
                      }}
                    >
                      Fill Password
                    </button>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Email Address</label>
                    <input
                      type="email"
                      value={adminCredentials.email}
                      onChange={(e) => setAdminCredentials({
                        ...adminCredentials, 
                        email: e.target.value.trim().toLowerCase() // Auto-trim and lowercase
                      })}
                      className="admin-input"
                      placeholder="imagesbyperidot@gmail.com"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Password</label>
                    <div className="admin-password-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={adminCredentials.password}
                        onChange={(e) => setAdminCredentials({
                          ...adminCredentials, 
                          password: e.target.value.trim() // Auto-trim
                        })}
                        className="admin-input"
                        placeholder="peridot2025"
                        onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                        autoComplete="current-password"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAdminLogin}
                    className="admin-login-button"
                  >
                    Access Dashboard
                  </button>

                  {/* Removed Test Auto-Login button for production security */}
                </div>

                <button
                  onClick={() => setCurrentView('client')}
                  className="back-to-client"
                >
                  ← Back to Client Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN DASHBOARD */}
        {currentView === 'admin' && isAdminAuthenticated && (
          <div className="admin-dashboard">
            {/* Admin Header */}
            <header className="admin-dashboard-header">
              <div className="admin-header-content">
                <div className="admin-header-left">
                  <div className="luxury-logo small">
                    <div className="logo-circle">
                      <span className="logo-text">P</span>
                    </div>
                  </div>
                  <div>
                    <h1 className="admin-dashboard-title">Peridot Admin Dashboard</h1>
                    <p className="admin-dashboard-subtitle">Manage your photography business</p>
                  </div>
                </div>
                
                <div className="admin-header-right">
                  {/* Notification Bell */}
                  <div className="admin-notification-container">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="admin-notification-bell"
                      title="Notifications"
                    >
                      🔔
                      {adminNotifications.filter(n => !n.read).length > 0 && (
                        <span className="notification-badge">
                          {adminNotifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <div className="notification-dropdown">
                        <div className="notification-header">
                          <h4>Notifications</h4>
                          <button
                            onClick={clearAllNotifications}
                            className="clear-notifications-btn"
                          >
                            Clear All
                          </button>
                        </div>
                        
                        <div className="notifications-list">
                          {adminNotifications.length === 0 ? (
                            <div className="no-notifications">
                              <p>No notifications</p>
                            </div>
                          ) : (
                            adminNotifications.slice(0, 10).map(notification => (
                              <div
                                key={notification.id}
                                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                onClick={() => markNotificationRead(notification.id)}
                              >
                                <div className="notification-content">
                                  <div className="notification-message">{notification.message}</div>
                                  <div className="notification-time">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </div>
                                </div>
                                {!notification.read && <div className="unread-indicator"></div>}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleAdminLogout}
                    className="admin-logout-button"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Enhanced Admin Navigation */}
              <nav className="admin-nav">
                <button
                  onClick={() => setAdminCurrentTab('dashboard')}
                  className={`admin-nav-item ${adminCurrentTab === 'dashboard' ? 'active' : ''}`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setAdminCurrentTab('bookings')}
                  className={`admin-nav-item ${adminCurrentTab === 'bookings' ? 'active' : ''}`}
                >
                  📅 Bookings
                </button>
                <button
                  onClick={() => setAdminCurrentTab('calendar')}
                  className={`admin-nav-item ${adminCurrentTab === 'calendar' ? 'active' : ''}`}
                >
                  🗓️ Calendar
                </button>
                <button
                  onClick={() => setAdminCurrentTab('packages')}
                  className={`admin-nav-item ${adminCurrentTab === 'packages' ? 'active' : ''}`}
                >
                  📦 Packages
                </button>
                <button
                  onClick={() => setAdminCurrentTab('discounts')}
                  className={`admin-nav-item ${adminCurrentTab === 'discounts' ? 'active' : ''}`}
                >
                  💰 Discounts
                </button>
                <button
                  onClick={() => setAdminCurrentTab('analytics')}
                  className={`admin-nav-item ${adminCurrentTab === 'analytics' ? 'active' : ''}`}
                >
                  📈 Analytics
                </button>
                <button
                  onClick={() => setAdminCurrentTab('hst')}
                  className={`admin-nav-item ${adminCurrentTab === 'hst' ? 'active' : ''}`}
                >
                  💰 HST Calculator
                </button>
                <button
                  onClick={() => setAdminCurrentTab('emails')}
                  className={`admin-nav-item ${adminCurrentTab === 'emails' ? 'active' : ''}`}
                >
                  📧 Email Manager
                </button>
                <button
                  onClick={() => setAdminCurrentTab('insights')}
                  className={`admin-nav-item ${adminCurrentTab === 'insights' ? 'active' : ''}`}
                >
                  💡 Business Insights
                </button>
                <button
                  onClick={() => setAdminCurrentTab('analytics-advanced')}
                  className={`admin-nav-item ${adminCurrentTab === 'analytics-advanced' ? 'active' : ''}`}
                >
                  🌍 Visitor Analytics
                </button>
                <button
                  onClick={() => setAdminCurrentTab('reviews')}
                  className={`admin-nav-item ${adminCurrentTab === 'reviews' ? 'active' : ''}`}
                >
                  ⭐ Reviews
                </button>
              </nav>
            </header>

            {/* Dashboard Overview */}
            {adminCurrentTab === 'dashboard' && (
              <div className="admin-content">
                <div className="dashboard-overview">
                  <h2 className="admin-section-title">Business Overview</h2>
                  
                  <div className="stats-grid">
                    <div className="stat-card revenue">
                      <div className="stat-icon">💰</div>
                      <div className="stat-content">
                        <div className="stat-value">${calculateRevenue().totalRevenue}</div>
                        <div className="stat-label">Total Revenue</div>
                      </div>
                    </div>
                    
                    <div className="stat-card monthly">
                      <div className="stat-icon">📅</div>
                      <div className="stat-content">
                        <div className="stat-value">${calculateRevenue().monthlyRevenue}</div>
                        <div className="stat-label">This Month</div>
                      </div>
                    </div>
                    
                    <div className="stat-card bookings">
                      <div className="stat-icon">📸</div>
                      <div className="stat-content">
                        <div className="stat-value">{calculateRevenue().confirmedCount}</div>
                        <div className="stat-label">Confirmed Sessions</div>
                      </div>
                    </div>
                    
                    <div className="stat-card pending">
                      <div className="stat-icon">⏳</div>
                      <div className="stat-content">
                        <div className="stat-value">{bookings.filter(b => b.status === 'held').length}</div>
                        <div className="stat-label">Pending Bookings</div>
                      </div>
                    </div>
                  </div>

                  <div className="recent-bookings">
                    <div className="section-header">
                      <h3 className="section-title">Recent Bookings</h3>
                      <button
                        onClick={exportBookingsCSV}
                        className="export-button"
                      >
                        📥 Export CSV
                      </button>
                    </div>

                    <div className="bookings-table">
                      {bookings.length === 0 ? (
                        <div className="no-bookings">
                          <div className="no-bookings-icon">📝</div>
                          <h4>No bookings yet</h4>
                          <p>New bookings will appear here once clients start booking sessions.</p>
                        </div>
                      ) : (
                        <div className="bookings-list">
                          {bookings.slice(0, 5).map((booking) => (
                            <div key={booking.id} className="booking-item">
                              <div className="booking-main">
                                <div className="booking-client">
                                  <strong>{booking.clientName}</strong>
                                  <span className="booking-email">{booking.email}</span>
                                </div>
                                <div className="booking-details">
                                  <span className="booking-package">{booking.package}</span>
                                  <span className="booking-date">{booking.date} at {booking.time}</span>
                                </div>
                                <div className="booking-price">${booking.totalPrice}</div>
                                <div className="booking-status">
                                  <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                                  <span className={`payment-badge ${booking.paymentStatus}`}>{booking.paymentStatus}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions Section */}
                  <div className="quick-actions-section">
                    <h3>⚡ Quick Actions</h3>
                    <div className="quick-actions-grid">
                      {quickActions.map(action => (
                        <button
                          key={action.id}
                          onClick={action.action}
                          className="quick-action-button"
                        >
                          <span className="action-icon">{action.icon}</span>
                          <span className="action-title">{action.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Business Insights Preview */}
                  <div className="dashboard-insights">
                    <h3>💡 Today's Insights</h3>
                    <div className="insights-preview">
                      {getBusinessInsights().slice(0, 3).map((insight, index) => (
                        <div key={index} className={`mini-insight ${insight.type}`}>
                          {insight.icon} {insight.title}: {insight.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Bookings Management with HST and Invoices */}
            {adminCurrentTab === 'bookings' && (
              <div className="admin-content">
                <div className="bookings-management">
                  <h2 className="admin-section-title">Bookings Management</h2>
                  
                  <div className="bookings-actions">
                    <button
                      onClick={exportBookingsCSV}
                      className="action-button primary"
                    >
                      📥 Export All Bookings
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Manually refreshing bookings...');
                          const freshBookings = await getBookings();
                          console.log('Fresh bookings loaded:', freshBookings.length);
                          setBookings(freshBookings);
                          alert(`✅ Refreshed! Found ${freshBookings.length} bookings.`);
                        } catch (error) {
                          console.error('Error refreshing bookings:', error);
                          alert('❌ Error refreshing bookings');
                        }
                      }}
                      className="action-button secondary"
                    >
                      🔄 Refresh Bookings
                    </button>
                    <button
                      onClick={() => {
                        const hstReport = bookings.map(booking => {
                          const hst = calculateHST(booking.totalPrice);
                          return {
                            client: booking.clientName,
                            date: booking.date,
                            subtotal: hst.subtotal,
                            hst: hst.hst,
                            total: hst.total
                          };
                        });
                        // console.log('HST Report:', hstReport); // Removed for production
                        alert('HST report generated! Check console for details.');
                      }}
                      className="action-button secondary"
                    >
                      📊 HST Report
                    </button>
                  </div>

                  <div className="bookings-table detailed">
                    <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
                      📊 <strong>Debug Info:</strong> Currently showing {bookings.length} bookings from Firebase
                    </div>
                    {bookings.length === 0 ? (
                      <div className="no-bookings">
                        <div className="no-bookings-icon">📝</div>
                        <h4>No bookings yet</h4>
                        <p>New bookings will appear here once clients start booking sessions.</p>
                        <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#6b7280' }}>
                          💡 Try clicking "🔄 Refresh Bookings" if you expect to see bookings here.
                        </p>
                      </div>
                    ) : (
                      <div className="bookings-list detailed">
                        {bookings.map((booking) => {
                          const hstBreakdown = calculateHSTBreakdown(booking.totalPrice); // ✅ NEW - USE THIS
                          return (
                            <div key={booking.id} className="booking-card">
                              <div className="booking-card-header">
                                <div className="booking-card-client">
                                  <h4>{booking.clientName}</h4>
                                  <div className="client-details">
                                    <span>📧 {booking.email}</span>
                                    <span>📱 {booking.phone}</span>
                                    {booking.birthday && <span>🎂 {booking.birthday}</span>}
                                  </div>
                                </div>
                                <div className="booking-card-status">
                                  <span className={`status-badge large ${booking.status}`}>{booking.status}</span>
                                  <span className={`payment-badge large ${booking.paymentStatus}`}>{booking.paymentStatus}</span>
                                  {booking.invoiceSent && <span className="invoice-badge">📧 Invoice Sent</span>}
                                </div>
                              </div>

                              <div className="booking-card-content">
                                <div className="booking-info-grid">
                                  <div className="info-item">
                                    <span className="info-label">Package:</span>
                                    <span className="info-value">{booking.package}</span>
                                  </div>
                                  <div className="info-item">
                                    <span className="info-label">Date & Time:</span>
                                    <span className="info-value">{booking.date} at {booking.time}</span>
                                  </div>
                                  <div className="info-item">
                                    <span className="info-label">Duration:</span>
                                    <span className="info-value">{booking.duration}</span>
                                  </div>
                                  
                                  {/* ✅ CORRECT HST BREAKDOWN - NO EXTRA CHARGES */}
                                  <div className="info-item">
                                    <span className="info-label">Service Amount:</span>
                                    <span className="info-value price">${hstBreakdown.serviceAmount}</span>
                                  </div>
                                  <div className="info-item">
                                    <span className="info-label">HST (13%):</span>
                                    <span className="info-value hst">${hstBreakdown.hstAmount}</span>
                                  </div>
                                  <div className="info-item">
                                    <span className="info-label">Total:</span>
                                    <span className="info-value total">${hstBreakdown.total}</span>
                                  </div>
                                </div>

                                {booking.addons && booking.addons.length > 0 && (
                                  <div className="booking-addons">
                                    <h5>Add-ons:</h5>
                                    <div className="addons-list">
                                      {booking.addons.map((addon, index) => (
                                        <span key={index} className="addon-tag">
                                          {addon.name} (+${addon.price})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {booking.discount && (
                                  <div className="booking-discount">
                                    <span className="discount-tag">
                                      💰 {booking.discount.code}: {booking.discount.description}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="booking-card-actions">
                                {booking.status === 'held' && (
                                  <>
                                    <button
                                      onClick={() => confirmBookingWithInvoice(booking.id)}
                                      className="action-button confirm"
                                    >
                                      ✅ Confirm & Send Invoice
                                    </button>
                                    <button
                                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                      className="action-button cancel"
                                    >
                                      ❌ Cancel Booking
                                    </button>
                                  </>
                                )}
                                
                                {booking.status === 'confirmed' && booking.paymentStatus === 'pending' && (
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'confirmed', 'paid')}
                                    className="action-button confirm"
                                  >
                                    💳 Mark as Paid
                                  </button>
                                )}

                                <button
                                  onClick={() => downloadInvoice(booking)}
                                  className="action-button invoice"
                                  title="Generate PDF invoice for download or printing"
                                >
                                  📄 Generate PDF Invoice
                                </button>

                                <button
                                  onClick={() => emailInvoice(booking)}
                                  className="action-button email"
                                  title="Send invoice via email to client"
                                >
                                  📧 Email Invoice to Client
                                </button>

                                <button
                                  onClick={() => handleEmailWithPDFAttachment(booking)}
                                  className="action-button primary"
                                  title="Send email with PDF attachment instructions"
                                >
                                  📎 Email with PDF Attachment
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Management */}
            {adminCurrentTab === 'calendar' && (
              <div className="admin-content">
                <div className="calendar-management-section">
                  <h2 className="admin-section-title">Calendar Management</h2>
                  <p className="section-description">Manage your availability, view bookings, and control your schedule</p>
                  
                  <div className="calendar-controls">
                    <div className="calendar-view-toggle">
                      <button
                        onClick={() => setCalendarView('year')}
                        className={`view-toggle-btn ${calendarView === 'year' ? 'active' : ''}`}
                      >
                        📅 Year View
                      </button>
                      <button
                        onClick={() => setCalendarView('month')}
                        className={`view-toggle-btn ${calendarView === 'month' ? 'active' : ''}`}
                      >
                        🗓️ Month View
                      </button>
                      <button
                        onClick={() => setCalendarView('week')}
                        className={`view-toggle-btn ${calendarView === 'week' ? 'active' : ''}`}
                      >
                        📋 Week View
                      </button>
                      <button
                        onClick={() => setCalendarView('simple')}
                        className={`view-toggle-btn ${calendarView === 'simple' ? 'active' : ''}`}
                      >
                        🗓️ Simple Calendar
                      </button>
                    </div>
                    
                    <div className="calendar-actions">
                      <button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          toggleDateBlock(today);
                        }}
                        className="action-button secondary"
                      >
                        🚫 Block Today
                      </button>
                      <button
                        onClick={() => {
                          setBlockedDates([]);
                          setBlockedTimeSlots({});
                          alert('✅ All dates and time slots unblocked!');
                        }}
                        className="action-button secondary"
                      >
                        ✅ Clear All Blocks
                      </button>
                    </div>
                    
                    <div className="calendar-legend">
                      <div className="legend-item available">
                        <span className="legend-dot"></span>
                        Available
                      </div>
                      <div className="legend-item booked">
                        <span className="legend-dot"></span>
                        Real Bookings
                      </div>
                      <div className="legend-item blocked">
                        <span className="legend-dot"></span>
                        Blocked/Fake
                      </div>
                    </div>
                  </div>

                  {/* YEAR VIEW - Enhanced with real booking display */}
                  {calendarView === 'year' && (
                    <div className="famwall-calendar">
                      <div className="calendar-year-grid">
                        {generateYearCalendar().map((month, monthIndex) => (
                          <div key={monthIndex} className="famwall-month-block">
                            <div className="month-header">
                              <h3 className="month-title">{month.name}</h3>
                              <div className="month-stats">
                                <span className="available-count">
                                  {month.dates.filter(d => !d.isBlocked && !d.hasBooking).length} available
                                </span>
                                <span className="booked-count">
                                  {month.dates.filter(d => d.hasBooking).length} booked
                                </span>
                                <span className="blocked-count">
                                  {month.dates.filter(d => d.isBlocked).length} blocked
                                </span>
                              </div>
                            </div>
                            
                            <div className="month-dates-grid">
                              {month.dates.map((dateObj) => {
                                const dayBookings = getBookingsForDate(dateObj.date);
                                const hasRealBooking = dayBookings.length > 0;

  return (
                                  <div
                                    key={dateObj.date}
                                    className={`famwall-date-card ${
                                      hasRealBooking ? 'booked' : 
                                      dateObj.isBlocked ? 'blocked' : 'available'
                                    }`}
                                    onClick={() => setSelectedDate(dateObj.date)}
                                  >
                                    <div className="date-number">{dateObj.day}</div>
                                    <div className="date-day">{dateObj.dayName}</div>
                                    
                                    {hasRealBooking && (
                                      <div className="booking-indicator">{dayBookings.length}</div>
                                    )}
                                    
                                    {hasRealBooking && (
                                      <div className="booking-preview">
                                        {dayBookings.slice(0, 2).map((booking, idx) => (
                                          <div key={idx} className="mini-booking">
                                            {booking.time} - {booking.clientName.split(' ')[0]}
                                          </div>
                                        ))}
                                        {dayBookings.length > 2 && (
                                          <div className="more-bookings">+{dayBookings.length - 2} more</div>
                                        )}
                                      </div>
                                    )}
                                    
                                    <button
                                      className="quick-block-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDateBlock(dateObj.date);
                                      }}
                                    >
                                      {dateObj.isBlocked ? '🔓' : '🔒'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MONTH VIEW - Focused single month */}
                  {calendarView === 'month' && (
                    <div className="month-view-container">
                      <div className="month-navigation">
                        <button
                          onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
                          disabled={currentMonth === 0}
                          className={`month-nav-btn ${currentMonth === 0 ? 'disabled' : ''}`}
                        >
                          ← Previous Month
                        </button>
                        
                        <h3 className="current-month-title">
                          {monthlyCalendar[currentMonth]?.name}
                        </h3>
                        
                        <button
                          onClick={() => setCurrentMonth(Math.min(monthlyCalendar.length - 1, currentMonth + 1))}
                          disabled={currentMonth === monthlyCalendar.length - 1}
                          className={`month-nav-btn ${currentMonth === monthlyCalendar.length - 1 ? 'disabled' : ''}`}
                        >
                          Next Month →
                        </button>
                      </div>

                      <div className="single-month-view">
                        <div className="month-dates-section">
                          <h4 className="section-title">
                            Available Weekend Dates - {monthlyCalendar[currentMonth]?.dates.length || 0} dates
                          </h4>
                          
                          <div className="enhanced-dates-grid">
                            {monthlyCalendar[currentMonth]?.dates.map((dateObj) => {
                              const dayBookings = getBookingsForDate(dateObj.date);
                              const isBlocked = blockedDates.includes(dateObj.date);
                              
                              return (
                                <div
                                  key={dateObj.date}
                                  onClick={() => setSelectedDate(dateObj.date)}
                                  className={`enhanced-date-card ${
                                    selectedDate === dateObj.date ? 'selected' : ''
                                  } ${
                                    dayBookings.length > 0 ? 'has-bookings' : 
                                    isBlocked ? 'blocked' : 'available'
                                  }`}
                                >
                                  <div className="date-number">{dateObj.day}</div>
                                  <div className="date-day-name">{dateObj.dayName}</div>
                                  
                                  {dayBookings.length > 0 && (
                                    <div className="bookings-summary">
                                      <div className="booking-count">{dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}</div>
                                      {dayBookings.map((booking, idx) => (
                                        <div key={idx} className="booking-item">
                                          <strong>{booking.time}</strong>
                                          <span>{booking.clientName}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {isBlocked && dayBookings.length === 0 && (
                                    <div className="blocked-indicator">🔒 Blocked</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SIMPLE CALENDAR VIEW - Google Calendar Style */}
                  {calendarView === 'simple' && (
                    <div className="simple-calendar-container">
                      <div className="simple-calendar-header">
                        <h3>Simple Calendar Management</h3>
                        <p>Click dates to block/unblock them. Changes sync immediately to client booking.</p>
                      </div>
                      
                      <div className="simple-calendar-grid">
                        {(() => {
                          const today = new Date();
                          const currentMonth = today.getMonth();
                          const currentYear = today.getFullYear();
                          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                          const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                          
                          const calendarDays = [];
                          
                          // Add empty cells for days before the first day of the month
                          for (let i = 0; i < firstDayOfMonth; i++) {
                            calendarDays.push(null);
                          }
                          
                          // Add all days of the month
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(currentYear, currentMonth, day);
                            const dateString = date.toISOString().split('T')[0];
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            const isBlocked = blockedDates.includes(dateString);
                            const hasBookings = getBookingsForDate(dateString).length > 0;
                            const isToday = dateString === today.toISOString().split('T')[0];
                            
                            calendarDays.push({
                              day,
                              date: dateString,
                              isWeekend,
                              isBlocked,
                              hasBookings,
                              isToday
                            });
                          }
                          
                          return calendarDays.map((dayData, index) => (
                            <div
                              key={index}
                              className={`simple-calendar-day ${
                                !dayData ? 'empty' : ''
                              } ${
                                dayData?.isWeekend ? 'weekend' : ''
                              } ${
                                dayData?.isBlocked ? 'blocked' : ''
                              } ${
                                dayData?.hasBookings ? 'has-bookings' : ''
                              } ${
                                dayData?.isToday ? 'today' : ''
                              }`}
                              onClick={() => {
                                if (dayData && dayData.isWeekend) {
                                  toggleDateBlock(dayData.date);
                                }
                              }}
                            >
                              {dayData && (
                                <>
                                  <div className="day-number">{dayData.day}</div>
                                  {dayData.isBlocked && <div className="blocked-icon">🔒</div>}
                                  {dayData.hasBookings && <div className="booking-icon">📸</div>}
                                  {dayData.isToday && <div className="today-indicator">Today</div>}
                                </>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                      
                      <div className="simple-calendar-legend">
                        <div className="legend-item">
                          <span className="legend-dot available"></span>
                          Available Weekend
                        </div>
                        <div className="legend-item">
                          <span className="legend-dot blocked"></span>
                          Blocked
                        </div>
                        <div className="legend-item">
                          <span className="legend-dot booked"></span>
                          Has Bookings
                        </div>
                        <div className="legend-item">
                          <span className="legend-dot today"></span>
                          Today
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WEEK VIEW - Google Calendar Style */}
                  {calendarView === 'week' && (
                    <div className="week-view-container">
                      <div className="week-navigation">
                        <button
                          onClick={() => {
                            const newWeekStart = new Date(getCurrentWeekStart());
                            newWeekStart.setDate(newWeekStart.getDate() - 7);
                            // You can add week navigation state if needed
                          }}
                          className="week-nav-btn"
                        >
                          ← Previous Week
                        </button>
                        
                        <h3 className="current-week-title">
                          Week of {getCurrentWeekStart().toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </h3>
                        
                        <button
                          onClick={() => {
                            const newWeekStart = new Date(getCurrentWeekStart());
                            newWeekStart.setDate(newWeekStart.getDate() + 7);
                            // You can add week navigation state if needed
                          }}
                          className="week-nav-btn"
                        >
                          Next Week →
                        </button>
                      </div>

                      <div className="week-grid">
                        <div className="time-column">
                          <div className="time-header">Time</div>
                          {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map(time => (
                            <div key={time} className="time-slot">{time}</div>
                          ))}
                        </div>
                        
                        {generateWeekView(getCurrentWeekStart()).map((day) => (
                          <div key={day.date} className="day-column">
                            <div className="day-header">
                              <div className="day-name">{day.dayName}</div>
                              <div className="day-number">{day.dayNumber}</div>
                              <div className="day-status">
                                {day.bookings.length > 0 ? `${day.bookings.length} booked` : 'Available'}
                              </div>
                            </div>
                            
                            <div className="day-time-slots">
                              {day.timeSlots.map((slot) => (
                                <div
                                  key={slot.time}
                                  className={`week-time-slot ${slot.status}`}
                                  onClick={() => setSelectedDate(day.date)}
                                >
                                  {slot.booking && (
                                    <div className="week-booking">
                                      <div className="booking-client">{slot.booking.clientName}</div>
                                      <div className="booking-package">{slot.booking.package}</div>
                                      <div className="booking-phone">{slot.booking.phone}</div>
                                    </div>
                                  )}
                                  
                                  {slot.status === 'blocked' && !slot.booking && (
                                    <div className="blocked-slot">
                                      <span>🔒 Blocked</span>
                                    </div>
                                  )}
                                  
                                  {slot.fakeBooking && (
                                    <div className="fake-booking-slot">
                                      <span>✨ {slot.fakeBooking.clientName}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Time Slot Management Section */}
                  <div className="time-slot-management" style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '2px solid rgba(245, 158, 11, 0.15)',
                    borderRadius: '20px',
                    padding: '24px',
                    marginTop: '32px',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)'
                  }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#262626',
                      marginBottom: '20px',
                      borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
                      paddingBottom: '16px'
                    }}>
                      ⏰ Time Slot Management
                    </h3>
                    
                    <div style={{marginBottom: '20px'}}>
                      <label style={{
                        display: 'block',
                        fontWeight: '600',
                        color: '#262626',
                        marginBottom: '8px'
                      }}>
                        Select Date for Time Management:
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                          padding: '12px 16px',
                          border: '2px solid rgba(245, 158, 11, 0.2)',
                          borderRadius: '12px',
                          fontSize: '1rem',
                          width: '200px',
                          background: 'rgba(255, 255, 255, 0.9)'
                        }}
                      />
                    </div>
                    
                    {selectedDate && (
                      <div className="time-slots-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '12px',
                        marginBottom: '20px'
                      }}>
                        {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map((time) => {
                          const isBlocked = blockedTimeSlots[selectedDate]?.includes(time);
                          const realBooking = bookings.find(b => b.date === selectedDate && b.time === time && b.status !== 'cancelled');
                          const fakeBooking = fakeBookings[selectedDate]?.find(fb => fb.time === time);
                          
                          return (
                            <div
                              key={time}
                              className={`time-slot-card ${
                                realBooking ? 'has-real-booking' : 
                                isBlocked ? 'has-fake-booking' : ''
                              }`}
                              style={{
                                background: realBooking ? 'rgba(16, 185, 129, 0.05)' : 
                                          isBlocked ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                                border: realBooking ? '2px solid rgba(16, 185, 129, 0.3)' :
                                       isBlocked ? '2px solid rgba(239, 68, 68, 0.3)' : '2px solid rgba(245, 158, 11, 0.15)',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center',
                                position: 'relative',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div style={{
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: realBooking ? '#059669' : isBlocked ? '#dc2626' : '#262626',
                                marginBottom: '8px'
                              }}>
                                {time}
                              </div>
                              
                              {realBooking && (
                                <div className="booking-info real-booking">
                                  <span className="booking-badge real">Real Booking</span>
                                  <div style={{fontSize: '0.8rem', color: '#059669'}}>
                                    {realBooking.clientName}
                                  </div>
                                  <div style={{fontSize: '0.7rem', color: '#059669'}}>
                                    {realBooking.package}
                                  </div>
                                </div>
                              )}
                              
                              {isBlocked && !realBooking && (
                                <div className="booking-info fake-booking">
                                  <span className="booking-badge fake">Blocked</span>
                                  <div className="fake-note">Time slot unavailable</div>
                                </div>
                              )}
                              
                              {!realBooking && (
                                <div className="time-slot-controls">
                                  <button
                                    className={`time-block-btn ${isBlocked ? 'unblock' : ''}`}
                                    onClick={() => toggleTimeSlotBlock(selectedDate, time)}
                                    disabled={realBooking}
                                    title={realBooking ? 'Cannot block - has real booking' : isBlocked ? 'Unblock time slot' : 'Block time slot'}
                                  >
                                    {isBlocked ? '🔓' : '🔒'}
                                  </button>
                                  
                                  {!isBlocked && !realBooking && (
                                    <button
                                      className="fake-booking-btn"
                                      onClick={() => {
                                        addFakeBooking(selectedDate, time);
                                      }}
                                      title="Add fake booking for testing"
                                    >
                                      ✨
                                    </button>
                                  )}
                                  
                                  {fakeBooking && (
                                    <button
                                      className="fake-booking-btn remove"
                                      onClick={() => {
                                        removeFakeBooking(selectedDate, time);
                                      }}
                                      title="Remove fake booking"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginTop: '20px'
                    }}>
                      <h4 style={{color: '#d97706', marginBottom: '12px'}}>📋 Quick Actions</h4>
                      <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                        <button
                          onClick={() => {
                            if (selectedDate) {
                              const times = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
                              times.forEach(time => {
                                if (!bookings.some(b => b.date === selectedDate && b.time === time)) {
                                  toggleTimeSlotBlock(selectedDate, time);
                                }
                              });
                            }
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#dc2626',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          🔒 Block All Available Times
                        </button>
                        
                        <button
                          onClick={() => {
                            if (selectedDate) {
                              setBlockedTimeSlots(prev => {
                                const newSlots = { ...prev };
                                delete newSlots[selectedDate];
                                localStorage.setItem('peridotBlockedTimeSlots', JSON.stringify(newSlots));
                                return newSlots;
                              });
                            }
                          }}
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          🔓 Unblock All Times
                        </button>
                        
                        <button
                          onClick={() => {
                            if (selectedDate) {
                              setFakeBookings(prev => {
                                const newBookings = { ...prev };
                                delete newBookings[selectedDate];
                                localStorage.setItem('peridotFakeBookings', JSON.stringify(newBookings));
                                return newBookings;
                              });
                            }
                          }}
                          style={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            color: '#7c3aed',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          🗑️ Clear Fake Bookings
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* DEBUG & TEST SECTION */}
                  <div className="debug-section" style={{
                    background: 'rgba(59, 130, 246, 0.1)', 
                    border: '1px solid rgba(59, 130, 246, 0.2)', 
                    borderRadius: '12px', 
                    padding: '16px', 
                    marginTop: '20px'
                  }}>
                    <h5 style={{color: '#1d4ed8', marginBottom: '12px'}}>🔧 Debug & Test Area</h5>
                    <div style={{fontSize: '0.8rem', color: '#1d4ed8'}}>
                      <p><strong>Selected Date:</strong> {selectedDate}</p>
                      <p><strong>Blocked Dates:</strong> {JSON.stringify(blockedDates)}</p>
                      <p><strong>Blocked Time Slots:</strong> {JSON.stringify(blockedTimeSlots)}</p>
                      <p><strong>Fake Bookings:</strong> {JSON.stringify(fakeBookings)}</p>
                      <p><strong>Weekdays Enabled:</strong> {weekdaysEnabled ? 'YES' : 'NO'}</p>
                    </div>
                    
                    <div style={{marginTop: '12px'}}>
                      <button
                        onClick={() => {
                                  // console.log('=== MANUAL TEST ==='); // Removed for production
        // console.log('Date:', selectedDate); // Removed for production
        // console.log('Time: 2:00 PM'); // Removed for production
        // console.log('Before toggle:', blockedTimeSlots); // Removed for production
                          toggleTimeSlotBlock(selectedDate, '2:00 PM');
                        }}
                        style={{
                          background: '#1d4ed8',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          marginRight: '8px'
                        }}
                      >
                        🧪 Test Block 2:00 PM
                      </button>
                      
                      <button
                        onClick={() => {
                          // console.log('=== CLEAR TEST ==='); // Removed for production
                          setBlockedTimeSlots({});
                          setFakeBookings({});
                          localStorage.removeItem('peridotBlockedTimeSlots');
                          localStorage.removeItem('peridotFakeBookings');
                          alert('Cleared all time blocks and fake bookings!');
                        }}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Clear All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics */}
            {adminCurrentTab === 'analytics' && (
              <div className="admin-content">
                <div className="analytics-section">
                  <h2 className="admin-section-title">Business Analytics</h2>
                  
                  <div className="analytics-grid">
                    <div className="analytics-card">
                      <h3>💰 Revenue Breakdown</h3>
                      <div className="revenue-details">
                        <div className="revenue-item">
                          <span>Total Revenue:</span>
                          <span className="revenue-amount">${calculateRevenue().totalRevenue}</span>
                        </div>
                        <div className="revenue-item">
                          <span>This Month:</span>
                          <span className="revenue-amount">${calculateRevenue().monthlyRevenue}</span>
                        </div>
                        <div className="revenue-item">
                          <span>Average per Session:</span>
                          <span className="revenue-amount">
                            ${calculateRevenue().confirmedCount > 0 ? 
                              Math.round(calculateRevenue().totalRevenue / calculateRevenue().confirmedCount) : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h3>📊 Session Types</h3>
                      <div className="session-breakdown">
                        {Object.entries(
                          bookings
                            .filter(b => b.status === 'confirmed')
                            .reduce((acc, booking) => {
                              acc[booking.package] = (acc[booking.package] || 0) + 1;
                              return acc;
                            }, {})
                        ).map(([packageName, count]) => (
                          <div key={packageName} className="session-type">
                            <span className="package-name">{packageName}</span>
                            <span className="package-count">{count} sessions</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h3>📈 Business Insights</h3>
                      <div className="insights-list">
                        <div className="insight-item">
                          <span className="insight-icon">📅</span>
                          <span>Total bookings: {bookings.length}</span>
                        </div>
                        <div className="insight-item">
                          <span className="insight-icon">✅</span>
                          <span>Confirmation rate: {bookings.length > 0 ? Math.round((bookings.filter(b => b.status === 'confirmed').length / bookings.length) * 100) : 0}%</span>
                        </div>
                        <div className="insight-item">
                          <span className="insight-icon">💳</span>
                          <span>Payment completion: {bookings.length > 0 ? Math.round((bookings.filter(b => b.paymentStatus === 'paid').length / bookings.length) * 100) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HST Calculator Tab */}
            {adminCurrentTab === 'hst' && (
              <div className="admin-content">
                <div className="hst-calculator-section" style={{maxWidth: 1200, margin: '0 auto'}}>
                  <h2 className="admin-section-title" style={{fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, color: '#262626', marginBottom: 8}}>HST Calculator & Reports</h2>
                  <p className="section-description" style={{color: '#525252', fontSize: '1.1rem', marginBottom: 32}}>Generate HST reports for CRA tax filings and compare months</p>
                  {(() => {
                    const months = [
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ];
                    // Current and previous month reports
                    const currentHSTReport = calculateMonthlyHSTReport(bookings);
                    const prevMonth = hstSelectedMonth === 0 ? 11 : hstSelectedMonth - 1;
                    const prevYear = hstSelectedMonth === 0 ? hstSelectedYear - 1 : hstSelectedYear;
                    const prevHSTReport = calculateMonthlyHST(bookings, prevMonth, prevYear);
                    // Comparison helpers
                    const compare = (curr, prev) => prev === 0 ? 'N/A' : ((curr - prev) >= 0 ? '+' : '') + (curr - prev).toFixed(2);
                    return (
                      <div className="hst-dashboard" style={{display: 'flex', flexDirection: 'column', gap: 32}}>
                        {/* Month Selector & Comparison */}
                        <div style={{display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24}}>
                          <div style={{background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24, flex: 1}}>
                            <h3 style={{marginBottom: 12, color: '#f59e0b'}}>📅 Select Month</h3>
                            <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                              <select value={hstSelectedMonth} onChange={e => setHstSelectedMonth(Number(e.target.value))} style={{padding: 8, borderRadius: 8, border: '1px solid #e2e8f0'}}>
                                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                              </select>
                              <input type="number" value={hstSelectedYear} min="2020" max={new Date().getFullYear()} onChange={e => setHstSelectedYear(Number(e.target.value))} style={{padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', width: 90}} />
                            </div>
                          </div>
                          <div style={{background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24, flex: 2}}>
                            <h3 style={{marginBottom: 12, color: '#10b981'}}>📊 Month Comparison</h3>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16}}>
                              <div>
                                <div style={{fontWeight: 600}}>Revenue</div>
                                <div style={{fontSize: '1.2rem', color: '#262626'}}>${currentHSTReport.totalRevenue}</div>
                                <div style={{fontSize: '0.9rem', color: '#888'}}>vs prev: {prevHSTReport ? compare(currentHSTReport.totalRevenue, prevHSTReport.totalRevenue) : 'N/A'}</div>
                              </div>
                              <div>
                                <div style={{fontWeight: 600}}>Service</div>
                                <div style={{fontSize: '1.2rem', color: '#262626'}}>${currentHSTReport.totalServiceAmount}</div>
                                <div style={{fontSize: '0.9rem', color: '#888'}}>vs prev: {prevHSTReport ? compare(currentHSTReport.totalServiceAmount, prevHSTReport.totalServiceAmount) : 'N/A'}</div>
                              </div>
                              <div>
                                <div style={{fontWeight: 600}}>HST</div>
                                <div style={{fontSize: '1.2rem', color: '#262626'}}>${currentHSTReport.totalHSTCollected}</div>
                                <div style={{fontSize: '0.9rem', color: '#888'}}>vs prev: {prevHSTReport ? compare(currentHSTReport.totalHSTCollected, prevHSTReport.totalHSTCollected) : 'N/A'}</div>
                              </div>
                              <div>
                                <div style={{fontWeight: 600}}>Sessions</div>
                                <div style={{fontSize: '1.2rem', color: '#262626'}}>{currentHSTReport.bookingCount}</div>
                                <div style={{fontSize: '0.9rem', color: '#888'}}>vs prev: {prevHSTReport ? compare(currentHSTReport.bookingCount, prevHSTReport.bookingCount) : 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Current Month HST Summary */}
                        <div className="hst-summary-card" style={{background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(245,158,11,0.08)', padding: 32, marginBottom: 24}}>
                          <h3 className="hst-card-title" style={{color: '#f59e0b', fontSize: '1.3rem', marginBottom: 8}}>📊 Current Month HST Summary</h3>
                          <div className="hst-period" style={{color: '#888', marginBottom: 16}}>{currentHSTReport.month}</div>
                          <div className="hst-stats-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24, marginBottom: 16}}>
                            <div className="hst-stat" style={{textAlign: 'center'}}>
                              <div className="hst-stat-value" style={{fontSize: '1.5rem', fontWeight: 700, color: '#262626'}}>${currentHSTReport.totalRevenue}</div>
                              <div className="hst-stat-label" style={{color: '#888'}}>Total Revenue (HST Included)</div>
                            </div>
                            <div className="hst-stat" style={{textAlign: 'center'}}>
                              <div className="hst-stat-value" style={{fontSize: '1.5rem', fontWeight: 700, color: '#262626'}}>${currentHSTReport.totalServiceAmount}</div>
                              <div className="hst-stat-label" style={{color: '#888'}}>Service Amount</div>
                            </div>
                            <div className="hst-stat hst-collected" style={{textAlign: 'center'}}>
                              <div className="hst-stat-value" style={{fontSize: '1.5rem', fontWeight: 700, color: '#10b981'}}>${currentHSTReport.totalHSTCollected}</div>
                              <div className="hst-stat-label" style={{color: '#10b981'}}>HST Collected (13%)</div>
                            </div>
                            <div className="hst-stat" style={{textAlign: 'center'}}>
                              <div className="hst-stat-value" style={{fontSize: '1.5rem', fontWeight: 700, color: '#262626'}}>{currentHSTReport.bookingCount}</div>
                              <div className="hst-stat-label" style={{color: '#888'}}>Sessions Completed</div>
                            </div>
                          </div>
                          <div className="hst-actions" style={{textAlign: 'right'}}>
                            <button
                              onClick={() => exportHSTReport(bookings)}
                              className="hst-button primary"
                              style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '1rem'}}
                            >
                              📥 Export Current Month HST Report
                            </button>
                          </div>
                        </div>
                        {/* HST Calculation Tool */}
                        <div className="hst-calculator-card" style={{background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(59,130,246,0.08)', padding: 32, marginBottom: 24}}>
                          <h3 className="hst-card-title" style={{color: '#3b82f6', fontSize: '1.2rem', marginBottom: 8}}>🧮 HST Calculator Tool</h3>
                          <p className="hst-card-description" style={{color: '#525252', marginBottom: 16}}>Calculate HST breakdown for any amount</p>
                          <div className="hst-calculator-tool">
                            <div className="hst-input-group" style={{marginBottom: 16}}>
                              <label className="hst-label" style={{fontWeight: 600, color: '#262626', marginBottom: 8, display: 'block'}}>Total Amount (HST Included):</label>
                              <input
                                type="number"
                                placeholder="Enter amount (e.g., 250)"
                                className="hst-input"
                                style={{width: '100%', padding: 12, border: '2px solid #f59e0b', borderRadius: 8, fontSize: '1rem'}}
                                onChange={(e) => {
                                  const amount = parseFloat(e.target.value) || 0;
                                  const breakdown = calculateHSTBreakdown(amount);
                                  const resultDiv = document.querySelector('.hst-calc-result');
                                  if (resultDiv && amount > 0) {
                                    resultDiv.innerHTML = `
                                      <div class='hst-breakdown-item' style='display:flex;justify-content:space-between;margin-bottom:8px;'><span>Service Amount:</span><span>$${breakdown.serviceAmount}</span></div>
                                      <div class='hst-breakdown-item' style='display:flex;justify-content:space-between;margin-bottom:8px;'><span>HST (13%):</span><span>$${breakdown.hstAmount}</span></div>
                                      <div class='hst-breakdown-item total' style='display:flex;justify-content:space-between;font-weight:700;color:#f59e0b;'><span>Total:</span><span>$${breakdown.total}</span></div>
                                    `;
                                    resultDiv.style.display = 'block';
                                  } else if (resultDiv) {
                                    resultDiv.style.display = 'none';
                                  }
                                }}
                              />
                            </div>
                            <div className="hst-calc-result" style={{display: 'none', background: '#fef7ed', border: '1px solid #f59e0b', borderRadius: 8, padding: 16, marginTop: 8}}>
                              {/* Results will be populated by the input handler */}
                            </div>
                          </div>
                        </div>
                        {/* HST Information */}
                        <div className="hst-info-card" style={{background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(16,185,129,0.08)', padding: 32}}>
                          <h3 className="hst-card-title" style={{color: '#10b981', fontSize: '1.2rem', marginBottom: 8}}>ℹ️ HST Information</h3>
                          <div className="hst-info-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16}}>
                            <div className="hst-info-item" style={{background: '#f0fdf4', borderRadius: 8, padding: 16}}>
                              <h4 style={{color: '#3b82f6', marginBottom: 8}}>🇨🇦 Ontario HST Rate</h4>
                              <p style={{color: '#525252', margin: 0}}>13% Harmonized Sales Tax applies to all photography services in Ontario, Canada.</p>
                            </div>
                            <div className="hst-info-item" style={{background: '#fef7ed', borderRadius: 8, padding: 16}}>
                              <h4 style={{color: '#f59e0b', marginBottom: 8}}>💰 Pricing Structure</h4>
                              <p style={{color: '#525252', margin: 0}}>All quoted prices include HST. Clients pay the advertised amount with no additional charges.</p>
                            </div>
                            <div className="hst-info-item" style={{background: '#eff6ff', borderRadius: 8, padding: 16}}>
                              <h4 style={{color: '#3b82f6', marginBottom: 8}}>📊 CRA Reporting</h4>
                              <p style={{color: '#525252', margin: 0}}>Use the exported HST reports for your quarterly or annual CRA filings.</p>
                            </div>
                            <div className="hst-info-item" style={{background: '#f0fdf4', borderRadius: 8, padding: 16}}>
                              <h4 style={{color: '#10b981', marginBottom: 8}}>🧮 Calculation Method</h4>
                              <p style={{color: '#525252', margin: 0}}>Service Amount = Total Price ÷ 1.13<br/>HST Amount = Total Price - Service Amount</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Discounts Tab */}
            {adminCurrentTab === 'discounts' && (
              <div className="admin-content">
                <div className="discounts-management-section">
                  <h2 className="admin-section-title">Discount Code Manager</h2>
                  <p className="section-description">Create, manage, and track your promotional discount codes</p>
                  {/* Discount Statistics */}
                  <div className="discount-stats-grid">
                    {(() => {
                      const stats = calculateDiscountStats();
                      return (
                        <>
                          <div className="discount-stat-card">
                            <div className="stat-icon">🎫</div>
                            <div className="stat-content">
                              <div className="stat-value">{stats.totalCodes}</div>
                              <div className="stat-label">Total Codes</div>
                            </div>
                          </div>
                          <div className="discount-stat-card active">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                              <div className="stat-value">{stats.activeCodes}</div>
                              <div className="stat-label">Active Codes</div>
                            </div>
                          </div>
                          <div className="discount-stat-card usage">
                            <div className="stat-icon">📊</div>
                            <div className="stat-content">
                              <div className="stat-value">{stats.totalUsage}</div>
                              <div className="stat-label">Total Usage</div>
                            </div>
                          </div>
                          <div className="discount-stat-card expired">
                            <div className="stat-icon">⏰</div>
                            <div className="stat-content">
                              <div className="stat-value">{stats.expiredCodes}</div>
                              <div className="stat-label">Expired Codes</div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {/* Action Buttons */}
                  <div className="discount-actions">
                    <button
                      onClick={() => {
                        resetDiscountForm();
                        setEditingDiscount(null);
                        setShowDiscountForm(true);
                      }}
                      className="action-button primary"
                    >
                      ➕ Create New Discount Code
                    </button>
                    <button
                      onClick={exportDiscountReport}
                      className="action-button secondary"
                    >
                      📥 Export Discount Report
                    </button>
                  </div>
                  {/* Discount Form Modal */}
                  {showDiscountForm && (
                    <div className="discount-form-overlay">
                      <div className="discount-form-modal">
                        <div className="discount-form-header">
                          <h3 className="discount-form-title">
                            {editingDiscount ? 'Edit Discount Code' : 'Create New Discount Code'}
                          </h3>
                          <button
                            onClick={() => {
                              setShowDiscountForm(false);
                              setEditingDiscount(null);
                              resetDiscountForm();
                            }}
                            className="discount-form-close"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="discount-form-content">
                          <div className="discount-form-grid">
                            <div className="discount-form-group">
                              <label className="discount-form-label">Discount Code *</label>
                              <input
                                type="text"
                                value={discountFormData.code}
                                onChange={(e) => setDiscountFormData({
                                  ...discountFormData, 
                                  code: e.target.value.toUpperCase()
                                })}
                                placeholder="e.g., SUMMER25"
                                className="discount-form-input"
                                maxLength={20}
                              />
                              <small className="discount-form-help">Use letters and numbers only</small>
                            </div>
                            <div className="discount-form-group">
                              <label className="discount-form-label">Discount Type *</label>
                              <select
                                value={discountFormData.type}
                                onChange={(e) => setDiscountFormData({
                                  ...discountFormData, 
                                  type: e.target.value
                                })}
                                className="discount-form-input"
                              >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount ($)</option>
                              </select>
                            </div>
                            <div className="discount-form-group">
                              <label className="discount-form-label">
                                Discount Value * {discountFormData.type === 'percentage' ? '(%)' : '($)'}
                              </label>
                              <input
                                type="number"
                                value={discountFormData.value}
                                onChange={(e) => setDiscountFormData({
                                  ...discountFormData, 
                                  value: e.target.value
                                })}
                                placeholder={discountFormData.type === 'percentage' ? '10' : '50'}
                                min="0"
                                max={discountFormData.type === 'percentage' ? '100' : '1000'}
                                className="discount-form-input"
                              />
                            </div>
                            <div className="discount-form-group full-width">
                              <label className="discount-form-label">Description *</label>
                              <input
                                type="text"
                                value={discountFormData.description}
                                onChange={(e) => setDiscountFormData({
                                  ...discountFormData, 
                                  description: e.target.value
                                })}
                                placeholder="e.g., 25% off summer family sessions"
                                className="discount-form-input"
                                maxLength={100}
                              />
                              <small className="discount-form-help">This is what customers will see</small>
                            </div>
                            <div className="discount-form-group">
                              <label className="discount-form-label">Expiry Date</label>
                              <input
                                type="date"
                                value={discountFormData.expiryDate}
                                onChange={(e) => setDiscountFormData({
                                  ...discountFormData, 
                                  expiryDate: e.target.value
                                })}
                                min={new Date().toISOString().split('T')[0]}
                                className="discount-form-input"
                              />
                              <small className="discount-form-help">Leave empty for no expiry</small>
                            </div>
                            <div className="discount-form-group">
                              <label className="discount-form-label">Usage Limit</label>
                              <input
                                type="number"
                                value={discountFormData.usageLimit}
                                onChange={(e) => setDiscountFormData({
                                  ...discountFormData, 
                                  usageLimit: e.target.value
                                })}
                                placeholder="e.g., 50"
                                min="1"
                                className="discount-form-input"
                              />
                              <small className="discount-form-help">Maximum number of uses (leave empty for unlimited)</small>
                            </div>
                            <div className="discount-form-group full-width">
                              <div className="discount-form-checkbox">
                                <input
                                  type="checkbox"
                                  id="discountActive"
                                  checked={discountFormData.isActive}
                                  onChange={(e) => setDiscountFormData({
                                    ...discountFormData, 
                                    isActive: e.target.checked
                                  })}
                                  className="discount-checkbox"
                                />
                                <label htmlFor="discountActive" className="discount-checkbox-label">
                                  Active (customers can use this code)
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="discount-form-actions">
                          <button
                            onClick={() => {
                              setShowDiscountForm(false);
                              setEditingDiscount(null);
                              resetDiscountForm();
                            }}
                            className="discount-form-button secondary"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={editingDiscount ? updateDiscountCode : createDiscountCode}
                            className="discount-form-button primary"
                          >
                            {editingDiscount ? 'Update Code' : 'Create Code'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Discount Codes Table */}
                  <div className="discount-codes-section">
                    <h3 className="section-title">All Discount Codes</h3>
                    {discountCodes.length === 0 ? (
                      <div className="no-discounts">
                        <div className="no-discounts-icon">🎫</div>
                        <h4>No discount codes yet</h4>
                        <p>Create your first discount code to start offering promotions to your clients.</p>
                        <button
                          onClick={() => {
                            resetDiscountForm();
                            setShowDiscountForm(true);
                          }}
                          className="action-button primary"
                        >
                          Create Your First Discount Code
                        </button>
                      </div>
                    ) : (
                      <div className="discount-codes-table">
                        {discountCodes.map((discount) => {
                          const isExpired = discount.expiryDate && new Date(discount.expiryDate) < new Date();
                          const bookingsWithCode = getBookingsWithDiscount(discount.code);
                          const usageCount = bookingsWithCode.length;
                          return (
                            <div key={discount.id} className={`discount-code-card ${!discount.isActive ? 'inactive' : ''} ${isExpired ? 'expired' : ''}`}>
                              <div className="discount-code-header">
                                <div className="discount-code-main">
                                  <div className="discount-code-name">{discount.code}</div>
                                  <div className="discount-code-value">
                                    {discount.type === 'percentage' ? `${discount.value}% OFF` : `$${discount.value} OFF`}
                                  </div>
                                </div>
                                <div className="discount-code-status">
                                  <span className={`discount-status-badge ${discount.isActive && !isExpired ? 'active' : 'inactive'}`}>
                                    {isExpired ? 'Expired' : discount.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                              <div className="discount-code-details">
                                <p className="discount-description">{discount.description}</p>
                                <div className="discount-info-grid">
                                  <div className="discount-info-item">
                                    <span className="info-label">Usage:</span>
                                    <span className="info-value">
                                      {usageCount} {discount.usageLimit ? `/ ${discount.usageLimit}` : ''} times
                                    </span>
                                  </div>
                                  <div className="discount-info-item">
                                    <span className="info-label">Expiry:</span>
                                    <span className="info-value">
                                      {discount.expiryDate ? new Date(discount.expiryDate).toLocaleDateString() : 'No expiry'}
                                    </span>
                                  </div>
                                  <div className="discount-info-item">
                                    <span className="info-label">Created:</span>
                                    <span className="info-value">
                                      {new Date(discount.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                {bookingsWithCode.length > 0 && (
                                  <div className="discount-usage-details">
                                    <h5>Recent Usage:</h5>
                                    <div className="usage-list">
                                      {bookingsWithCode.slice(0, 3).map((booking, idx) => (
                                        <div key={idx} className="usage-item">
                                          <span className="usage-client">{booking.clientName}</span>
                                          <span className="usage-date">{new Date(booking.createdAt).toLocaleDateString()}</span>
                                          <span className="usage-amount">${booking.totalPrice}</span>
                                        </div>
                                      ))}
                                      {bookingsWithCode.length > 3 && (
                                        <div className="usage-more">+{bookingsWithCode.length - 3} more uses</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="discount-code-actions">
                                <button
                                  onClick={() => startEditingDiscount(discount)}
                                  className="discount-action-btn edit"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => toggleDiscountStatus(discount.id)}
                                  className={`discount-action-btn ${discount.isActive ? 'deactivate' : 'activate'}`}
                                >
                                  {discount.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                                </button>
                                <button
                                  onClick={() => deleteDiscountCode(discount.id)}
                                  className="discount-action-btn delete"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Packages Tab */}
            {adminCurrentTab === 'packages' && (
              <div className="admin-content">
                <div className="packages-management-section">
                  <h2 className="admin-section-title">Package Manager</h2>
                  <p className="section-description">Add, edit, and organize your luxury photography packages and categories</p>
                  {/* Category Tabs */}
                  <div className="package-categories-tabs">
                    {Object.keys(localPackages).map((cat) => (
                      <div key={cat} className="category-tab-container">
                        <button
                          className={`category-tab${selectedCategory === cat ? ' active' : ''}`}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          {localCategoryNames[cat] || cat}
                          <span className="category-count">{localPackages[cat].length}</span>
                        </button>
                        <button
                          className="category-delete-btn"
                          onClick={() => deleteCategory(cat)}
                          title={`Delete ${localCategoryNames[cat] || cat} category`}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <button
                      className="category-tab"
                      onClick={() => setShowCategoryForm(true)}
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontWeight: 700 }}
                    >
                      ➕ Add Category
                    </button>
                  </div>
                  {/* Category Form Modal */}
                  {showCategoryForm && (
                    <div className="package-form-overlay">
                      <div className="package-form-modal">
                        <div className="package-form-header">
                          <h3 className="package-form-title">Add New Category</h3>
                          <button className="package-form-close" onClick={() => setShowCategoryForm(false)}>✕</button>
                        </div>
                        <div className="package-form-content">
                          <div className="package-form-group">
                            <label className="package-form-label">Category Name *</label>
                            <input
                              type="text"
                              value={categoryFormData.name}
                              onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                              className="package-form-input"
                              placeholder="e.g., Family, Headshots"
                            />
                          </div>
                          <div className="package-form-group">
                            <label className="package-form-label">Category Key *</label>
                            <input
                              type="text"
                              value={categoryFormData.key}
                              onChange={e => setCategoryFormData({ ...categoryFormData, key: e.target.value.replace(/\s+/g, '').toLowerCase() })}
                              className="package-form-input"
                              placeholder="e.g., family, headshots"
                            />
                          </div>
                        </div>
                        <div className="package-form-actions">
                          <button className="package-form-button secondary" onClick={() => setShowCategoryForm(false)}>Cancel</button>
                          <button className="package-form-button primary" onClick={addCategory}>Add Category</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Packages Display */}
                  <div className="packages-display-section">
                    <div className="packages-section-header">
                      <h3 className="packages-section-title">{localCategoryNames[selectedCategory] || selectedCategory || 'Select a Category'}</h3>
                      {selectedCategory && (
                        <button className="add-package-btn" onClick={() => { setEditingPackage(null); setPackageFormData({ name: '', price: '', duration: '', people: '', outfits: '', backdrops: '', images: '', location: '', special: '', note: '', isActive: true }); setShowPackageEditor(true); }}>➕ Add Package</button>
                      )}
                    </div>
                    {selectedCategory && localPackages[selectedCategory] && localPackages[selectedCategory].length === 0 && (
                      <div className="no-packages">
                        <div className="no-packages-icon">📦</div>
                        <h4>No packages in this category</h4>
                        <p>Add your first package to get started.</p>
                        <button className="add-package-btn" onClick={() => { setEditingPackage(null); setPackageFormData({ name: '', price: '', duration: '', people: '', outfits: '', backdrops: '', images: '', location: '', special: '', note: '', isActive: true }); setShowPackageEditor(true); }}>Add Package</button>
                      </div>
                    )}
                    {selectedCategory && localPackages[selectedCategory] && localPackages[selectedCategory].length > 0 && (
                      <div className="packages-grid">
                        {localPackages[selectedCategory].map(pkg => (
                          <div key={pkg.id} className={`package-card${pkg.isActive === false ? ' inactive' : ''}`}>
                            <div className="package-card-header">
                              <div className="package-name">{pkg.name}</div>
                              <div className="package-price">{typeof pkg.price === 'number' ? `$${pkg.price}` : pkg.price}</div>
                            </div>
                            <div className="package-details">
                              <div className="package-detail-item"><span className="detail-label">Duration:</span> <span className="detail-value">{pkg.duration}</span></div>
                              <div className="package-detail-item"><span className="detail-label">People:</span> <span className="detail-value">{pkg.people}</span></div>
                              <div className="package-detail-item"><span className="detail-label">Outfits:</span> <span className="detail-value">{pkg.outfits}</span></div>
                              <div className="package-detail-item"><span className="detail-label">Backdrops:</span> <span className="detail-value">{pkg.backdrops}</span></div>
                              <div className="package-detail-item"><span className="detail-label">Images:</span> <span className="detail-value">{pkg.images}</span></div>
                              <div className="package-detail-item"><span className="detail-label">Location:</span> <span className="detail-value">{pkg.location}</span></div>
                              {pkg.special && <div className="package-special"><span className="special-label">Special:</span> <span className="special-value">{pkg.special}</span></div>}
                              {pkg.note && <div className="package-note"><span className="note-label">Note:</span> <span className="note-value">{pkg.note}</span></div>}
                            </div>
                            <div className="package-actions">
                              <button className="package-action-btn edit" onClick={() => { setEditingPackage(pkg); setPackageFormData({ ...pkg }); setShowPackageEditor(true); }}>✏️ Edit</button>
                              <button className="package-action-btn duplicate" onClick={() => duplicatePackage(pkg)}>📋 Duplicate</button>
                              <button className={`package-action-btn ${pkg.isActive === false ? 'activate' : 'deactivate'}`} onClick={() => togglePackageStatus(pkg.id)}>{pkg.isActive === false ? '▶️ Activate' : '⏸️ Deactivate'}</button>
                              <button className="package-action-btn delete" onClick={() => deletePackage(pkg.id)}>🗑️ Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Package Editor Modal */}
                  {showPackageEditor && (
                    <div className="package-form-overlay">
                      <div className="package-form-modal">
                        <div className="package-form-header">
                          <h3 className="package-form-title">{editingPackage ? 'Edit Package' : 'Add New Package'}</h3>
                          <button className="package-form-close" onClick={() => { setShowPackageEditor(false); setEditingPackage(null); }}>✕</button>
                        </div>
                        <div className="package-form-content">
                          <div className="package-form-grid">
                            <div className="package-form-group">
                              <label className="package-form-label">Name *</label>
                              <input type="text" className="package-form-input" value={packageFormData.name} onChange={e => setPackageFormData({ ...packageFormData, name: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">Price *</label>
                              <input type="number" className="package-form-input" value={packageFormData.price} onChange={e => setPackageFormData({ ...packageFormData, price: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">Duration *</label>
                              <input type="text" className="package-form-input" value={packageFormData.duration} onChange={e => setPackageFormData({ ...packageFormData, duration: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">People *</label>
                              <input type="text" className="package-form-input" value={packageFormData.people} onChange={e => setPackageFormData({ ...packageFormData, people: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">Outfits *</label>
                              <input type="text" className="package-form-input" value={packageFormData.outfits} onChange={e => setPackageFormData({ ...packageFormData, outfits: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">Backdrops *</label>
                              <input type="text" className="package-form-input" value={packageFormData.backdrops} onChange={e => setPackageFormData({ ...packageFormData, backdrops: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">Images *</label>
                              <input type="text" className="package-form-input" value={packageFormData.images} onChange={e => setPackageFormData({ ...packageFormData, images: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">Location *</label>
                              <input type="text" className="package-form-input" value={packageFormData.location} onChange={e => setPackageFormData({ ...packageFormData, location: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">Special</label>
                              <input type="text" className="package-form-input" value={packageFormData.special} onChange={e => setPackageFormData({ ...packageFormData, special: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">Note</label>
                              <input type="text" className="package-form-input" value={packageFormData.note} onChange={e => setPackageFormData({ ...packageFormData, note: e.target.value })} />
                            </div>
                            <div className="package-form-group">
                              <label className="package-form-label">Active</label>
                              <input type="checkbox" checked={packageFormData.isActive !== false} onChange={e => setPackageFormData({ ...packageFormData, isActive: e.target.checked })} />
                            </div>
                          </div>
                        </div>
                        <div className="package-form-actions">
                          <button className="package-form-button secondary" onClick={() => { setShowPackageEditor(false); setEditingPackage(null); }}>Cancel</button>
                          <button className="package-form-button primary" onClick={editingPackage ? updatePackage : addPackage}>{editingPackage ? 'Update Package' : 'Add Package'}</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Management Tab */}
            {adminCurrentTab === 'emails' && (
              <div className="admin-content">
                <div className="email-management-section">
                  <h2 className="admin-section-title">Email Management</h2>
                  
                  {/* Email Settings */}
                  <div className="email-settings-card">
                    <h3>⚙️ Automation Settings</h3>
                    <div className="email-settings-grid">
                      <label>
                        <input 
                          type="checkbox" 
                          checked={emailSettings.autoConfirmation}
                          onChange={(e) => setEmailSettings({...emailSettings, autoConfirmation: e.target.checked})}
                        />
                        Auto-send confirmation emails
                      </label>
                      <label>
                        <input 
                          type="checkbox" 
                          checked={emailSettings.autoReminders}
                          onChange={(e) => setEmailSettings({...emailSettings, autoReminders: e.target.checked})}
                        />
                        Auto-send reminder emails
                      </label>
                      <label>
                        <input 
                          type="checkbox" 
                          checked={emailSettings.autoFollowUp}
                          onChange={(e) => setEmailSettings({...emailSettings, autoFollowUp: e.target.checked})}
                        />
                        Auto-send follow-up emails
                      </label>
                    </div>
                  </div>
                  
                  {/* Quick Email Actions */}
                  <div className="email-quick-actions">
                    <button onClick={() => {
                      const todayBookings = bookings.filter(b => 
                        b.date === new Date().toISOString().split('T')[0] && b.status === 'confirmed'
                      );
                      todayBookings.forEach(booking => sendAutomatedEmail(booking, 'reminder'));
                    }}>
                      📧 Email Today's Clients
                    </button>
                    
                    <button onClick={() => {
                      const recentBookings = bookings.filter(b => 
                        new Date(b.date) < new Date() && 
                        new Date() - new Date(b.date) <= 3 * 24 * 60 * 60 * 1000 &&
                        b.status === 'confirmed'
                      );
                      recentBookings.forEach(booking => sendAutomatedEmail(booking, 'followUp'));
                    }}>
                      📩 Send Follow-ups
                    </button>

                    <button onClick={() => {
                      sendBirthdayEmails();
                      alert('Birthday emails sent to clients with birthdays today!');
                    }}>
                      🎂 Send Birthday Emails
                    </button>

                    <button onClick={() => {
                      checkExpiredBookings();
                      alert('Expired bookings checked and cancellation emails sent!');
                    }}>
                      ⏰ Check Expired Bookings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Analytics Tab */}
            {adminCurrentTab === 'insights' && (
              <div className="admin-content">
                <div className="insights-section">
                  <h2 className="admin-section-title">Business Insights</h2>
                  
                  {/* Business Intelligence Cards */}
                  <div className="insights-grid">
                    {getBusinessInsights().map((insight, index) => (
                      <div key={index} className={`insight-card ${insight.type}`}>
                        <div className="insight-icon">{insight.icon}</div>
                        <div className="insight-content">
                          <h4>{insight.title}</h4>
                          <p>{insight.message}</p>
                          <small>{insight.action}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Revenue Chart */}
                  <div className="revenue-chart-section">
                    <h3>📈 6-Month Revenue Trend</h3>
                    <div className="simple-chart">
                      {getAdvancedAnalytics().last6Months.map((month, index) => (
                        <div key={index} className="chart-bar">
                          <div 
                            className="bar" 
                            style={{
                              height: `${(month.revenue / 1000) * 100}px`,
                              backgroundColor: '#f59e0b'
                            }}
                          />
                          <span className="bar-label">{month.month}</span>
                          <span className="bar-value">${month.revenue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Visitor Analytics Tab */}
            {adminCurrentTab === 'analytics-advanced' && (
              <div className="admin-content">
                <div className="visitor-analytics-section">
                  <h2 className="admin-section-title">Visitor Analytics & Marketing Insights</h2>
                  <p className="section-description">Track where your visitors come from and how they interact with your booking site</p>
                  
                  {/* Real-time visitor info */}
                  <LiveVisitorInfo />
                  
                  {/* Marketing Overview */}
                  <div className="marketing-overview">
                    {(() => {
                      const insights = getMarketingInsights();
                      return (
                        <>
                          <div className="marketing-stats-grid">
                            <div className="marketing-stat-card visitors">
                              <div className="stat-icon">👥</div>
                              <div className="stat-content">
                                <div className="stat-value">{insights.totalVisitors}</div>
                                <div className="stat-label">Total Visitors</div>
                              </div>
                            </div>
                            <div className="marketing-stat-card conversion">
                              <div className="stat-icon">🎯</div>
                              <div className="stat-content">
                                <div className="stat-value">{insights.conversionRate}%</div>
                                <div className="stat-label">Conversion Rate</div>
                              </div>
                            </div>
                            <div className="marketing-stat-card locations">
                              <div className="stat-icon">🌍</div>
                              <div className="stat-content">
                                <div className="stat-value">{insights.topLocations.length}</div>
                                <div className="stat-label">Cities Reached</div>
                              </div>
                            </div>
                            <div className="marketing-stat-card mobile">
                              <div className="stat-icon">📱</div>
                              <div className="stat-content">
                                <div className="stat-value">{Math.round((insights.deviceStats.Mobile || 0) / insights.totalVisitors * 100)}%</div>
                                <div className="stat-label">Mobile Users</div>
                              </div>
                            </div>
                          </div>

                          {/* Conversion Funnel */}
                          <div className="conversion-funnel-card">
                            <h3>📈 Booking Conversion Funnel</h3>
                            <div className="funnel-steps">
                              <div className="funnel-step">
                                <div className="step-label">Visitors</div>
                                <div className="step-value">{insights.funnelData.visitors}</div>
                                <div className="step-bar" style={{width: '100%'}}></div>
                              </div>
                              <div className="funnel-step">
                                <div className="step-label">Viewed Categories</div>
                                <div className="step-value">{insights.funnelData.categoryViews}</div>
                                <div className="step-bar" style={{width: `${(insights.funnelData.categoryViews / insights.funnelData.visitors * 100)}%`}}></div>
                              </div>
                              <div className="funnel-step">
                                <div className="step-label">Viewed Packages</div>
                                <div className="step-value">{insights.funnelData.packageViews}</div>
                                <div className="step-bar" style={{width: `${(insights.funnelData.packageViews / insights.funnelData.visitors * 100)}%`}}></div>
                              </div>
                              <div className="funnel-step">
                                <div className="step-label">Started Booking</div>
                                <div className="step-value">{insights.funnelData.bookingStarted}</div>
                                <div className="step-bar" style={{width: `${(insights.funnelData.bookingStarted / insights.funnelData.visitors * 100)}%`}}></div>
                              </div>
                              <div className="funnel-step">
                                <div className="step-label">Completed Booking</div>
                                <div className="step-value">{insights.funnelData.bookingCompleted}</div>
                                <div className="step-bar" style={{width: `${(insights.funnelData.bookingCompleted / insights.funnelData.visitors * 100)}%`}}></div>
                              </div>
                            </div>
                          </div>

                          {/* Top Locations */}
                          <div className="top-locations-card">
                            <h3>🌍 Top Visitor Locations</h3>
                            <div className="locations-list">
                              {insights.topLocations.map(([location, count], index) => (
                                <div key={location} className="location-item">
                                  <span className="location-rank">#{index + 1}</span>
                                  <span className="location-name">{location}</span>
                                  <span className="location-count">{count} visitors</span>
                                  <div className="location-bar">
                                    <div 
                                      className="location-fill" 
                                      style={{width: `${(count / insights.topLocations[0][1] * 100)}%`}}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Traffic Sources */}
                          <div className="traffic-sources-card">
                            <h3>🔗 Traffic Sources</h3>
                            <div className="traffic-sources-list">
                              {insights.topReferrers.map(([referrer, count], index) => {
                                const displayReferrer = referrer === 'Direct' ? '🔗 Direct Traffic' : 
                                                      referrer.includes('google') ? '🔍 Google Search' :
                                                      referrer.includes('facebook') ? '📘 Facebook' :
                                                      referrer.includes('instagram') ? '📸 Instagram' :
                                                      `🌐 ${new URL(referrer).hostname}`;
                                
                                return (
                                  <div key={referrer} className="traffic-source-item">
                                    <span className="source-name">{displayReferrer}</span>
                                    <span className="source-count">{count} visits</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 7-Day Trend */}
                          <div className="trend-chart-card">
                            <h3>📊 7-Day Visitor Trend</h3>
                            <div className="trend-chart">
                              {insights.last7Days.map((day, index) => (
                                <div key={day.date} className="trend-day">
                                  <div 
                                    className="trend-bar" 
                                    style={{
                                      height: `${Math.max(20, (day.visitors / Math.max(...insights.last7Days.map(d => d.visitors)) * 100))}px`
                                    }}
                                  ></div>
                                  <span className="trend-label">{new Date(day.date).toLocaleDateString('en-US', {weekday: 'short'})}</span>
                                  <span className="trend-value">{day.visitors}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Analytics Actions */}
                  <div className="analytics-actions">
                    <button
                      onClick={exportAnalyticsData}
                      className="action-button primary"
                    >
                      📊 Export Analytics Data
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('This will clear all visitor analytics data. Are you sure?')) {
                          setVisitorAnalytics({
                            totalVisitors: 0,
                            uniqueVisitors: 0,
                            pageViews: 0,
                            locations: {},
                            referrers: {},
                            devices: {},
                            browsers: {},
                            dailyStats: {},
                            conversionFunnel: {
                              visitors: 0,
                              categoryViews: 0,
                              packageViews: 0,
                              bookingStarted: 0,
                              bookingCompleted: 0
                            }
                          });
                          localStorage.removeItem('peridotVisitorAnalytics');
                          alert('Analytics data cleared!');
                        }
                      }}
                      className="action-button secondary"
                    >
                      🗑️ Clear Analytics Data
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Reviews Tab */}
            {adminCurrentTab === 'reviews' && (
              <div className="admin-content">
                <div className="reviews-management-section">
                  <h2 className="admin-section-title">Review Management</h2>
                  <p className="section-description">Manage and approve client reviews</p>
                  {/* Review Statistics */}
                  <div className="review-stats-grid">
                    {(() => {
                      const stats = getReviewStats();
                      return (
                        <>
                          <div className="review-stat-card">
                            <div className="stat-icon">⭐</div>
                            <div className="stat-content">
                              <div className="stat-value">{stats.totalReviews}</div>
                              <div className="stat-label">Total Reviews</div>
                            </div>
                          </div>
                          <div className="review-stat-card average">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                              <div className="stat-value">{stats.averageRating}/5</div>
                              <div className="stat-label">Average Rating</div>
                            </div>
                          </div>
                          <div className="review-stat-card verified">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                              <div className="stat-value">{stats.verifiedReviews}</div>
                              <div className="stat-label">Verified Reviews</div>
                            </div>
                          </div>
                          <div className="review-stat-card featured">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                              <div className="stat-value">{stats.featuredReviews}</div>
                              <div className="stat-label">Featured Reviews</div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {/* Action Buttons */}
                  <div className="review-actions">
                    <button
                      onClick={() => {
                        setEditingReview(null);
                        setNewReview({
                          name: '',
                          rating: 5,
                          text: '',
                          package: '',
                          verified: false,
                          featured: false
                        });
                        setShowReviewForm(true);
                      }}
                      className="action-button primary"
                    >
                      ➕ Add New Review
                    </button>
                  </div>
                  {/* Review Form Modal */}
                  {showReviewForm && (
                    <div className="review-form-overlay">
                      <div className="review-form-modal">
                        <div className="review-form-header">
                          <h3 className="review-form-title">
                            {editingReview ? 'Edit Review' : 'Add New Review'}
                          </h3>
                          <button
                            onClick={() => {
                              setShowReviewForm(false);
                              setEditingReview(null);
                              setNewReview({
                                name: '',
                                rating: 5,
                                text: '',
                                package: '',
                                verified: false,
                                featured: false
                              });
                            }}
                            className="review-form-close"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="review-form-content">
                          <div className="review-form-grid">
                            <div className="review-form-group">
                              <label className="review-form-label">Name *</label>
                              <input
                                type="text"
                                value={editingReview ? editingReview.name : newReview.name}
                                onChange={(e) => {
                                  if (editingReview) {
                                    setEditingReview({ ...editingReview, name: e.target.value });
                                  } else {
                                    setNewReview({ ...newReview, name: e.target.value });
                                  }
                                }}
                                className="review-form-input"
                                placeholder="Enter client name"
                              />
                            </div>
                            <div className="review-form-group">
                              <label className="review-form-label">Rating *</label>
                              <select
                                value={editingReview ? editingReview.rating : newReview.rating}
                                onChange={(e) => {
                                  if (editingReview) {
                                    setEditingReview({ ...editingReview, rating: Number(e.target.value) });
                                  } else {
                                    setNewReview({ ...newReview, rating: Number(e.target.value) });
                                  }
                                }}
                                className="review-form-input"
                              >
                                <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                                <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                                <option value={3}>⭐⭐⭐ (3 stars)</option>
                                <option value={2}>⭐⭐ (2 stars)</option>
                                <option value={1}>⭐ (1 star)</option>
                              </select>
                            </div>
                            <div className="review-form-group full-width">
                              <label className="review-form-label">Review Text *</label>
                              <textarea
                                value={editingReview ? editingReview.text : newReview.text}
                                onChange={(e) => {
                                  if (editingReview) {
                                    setEditingReview({ ...editingReview, text: e.target.value });
                                  } else {
                                    setNewReview({ ...newReview, text: e.target.value });
                                  }
                                }}
                                className="review-form-textarea"
                                placeholder="Enter the review text"
                                rows="4"
                              ></textarea>
                            </div>
                            <div className="review-form-group">
                              <label className="review-form-label">Package</label>
                              <input
                                type="text"
                                value={editingReview ? editingReview.package : newReview.package}
                                onChange={(e) => {
                                  if (editingReview) {
                                    setEditingReview({ ...editingReview, package: e.target.value });
                                  } else {
                                    setNewReview({ ...newReview, package: e.target.value });
                                  }
                                }}
                                className="review-form-input"
                                placeholder="e.g., Family Standard"
                              />
                            </div>
                            <div className="review-form-group">
                              <label className="review-form-label">
                                <input
                                  type="checkbox"
                                  checked={editingReview ? editingReview.verified : newReview.verified}
                                  onChange={(e) => {
                                    if (editingReview) {
                                      setEditingReview({ ...editingReview, verified: e.target.checked });
                                    } else {
                                      setNewReview({ ...newReview, verified: e.target.checked });
                                    }
                                  }}
                                  className="review-form-checkbox"
                                />
                                Verified Review
                              </label>
                            </div>
                            <div className="review-form-group">
                              <label className="review-form-label">
                                <input
                                  type="checkbox"
                                  checked={editingReview ? editingReview.featured : newReview.featured}
                                  onChange={(e) => {
                                    if (editingReview) {
                                      setEditingReview({ ...editingReview, featured: e.target.checked });
                                    } else {
                                      setNewReview({ ...newReview, featured: e.target.checked });
                                    }
                                  }}
                                  className="review-form-checkbox"
                                />
                                Featured Review
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="review-form-actions">
                          <button
                            onClick={() => {
                              setShowReviewForm(false);
                              setEditingReview(null);
                              setNewReview({
                                name: '',
                                rating: 5,
                                text: '',
                                package: '',
                                verified: false,
                                featured: false
                              });
                            }}
                            className="review-form-button secondary"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (editingReview) {
                                updateReview(editingReview.id);
                              } else {
                                addReview();
                              }
                              setShowReviewForm(false);
                            }}
                            className="review-form-button primary"
                          >
                            {editingReview ? 'Update Review' : 'Add Review'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Reviews Table */}
                  <div className="reviews-list">
                    <h3>All Reviews ({reviews.length})</h3>
                    {reviews.length === 0 ? (
                      <div className="no-reviews">
                        <p>No reviews yet. Add your first review!</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="review-card">
                          <div className="review-card-header">
                            <div className="review-info">
                              <div className="review-rating">
                                {'⭐'.repeat(review.rating)}
                              </div>
                              <div className="review-author">
                                <strong>{review.name}</strong>
                                {review.verified && <span className="verified-badge">✓ Verified</span>}
                                {review.featured && <span className="featured-badge">⭐ Featured</span>}
                              </div>
                              <div className="review-meta">
                                <span className="review-date">{new Date(review.date).toLocaleDateString()}</span>
                                {review.package && <span className="review-package">• {review.package}</span>}
                              </div>
                            </div>
                            <div className="review-actions">
                              <button
                                onClick={() => {
                                  setEditingReview({ ...review });
                                  setShowReviewForm(true);
                                }}
                                className="action-btn edit"
                                title="Edit Review"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => toggleReviewFeatured(review.id)}
                                className={`action-btn ${review.featured ? 'featured' : 'unfeatured'}`}
                                title={review.featured ? 'Remove from Featured' : 'Mark as Featured'}
                              >
                                {review.featured ? '⭐' : '☆'}
                              </button>
                              <button
                                onClick={() => toggleReviewVerified(review.id)}
                                className={`action-btn ${review.verified ? 'verified' : 'unverified'}`}
                                title={review.verified ? 'Mark as Unverified' : 'Mark as Verified'}
                              >
                                {review.verified ? '✓' : '○'}
                              </button>
                              <button
                                onClick={() => deleteReview(review.id)}
                                className="action-btn delete"
                                title="Delete Review"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div className="review-content">
                            <p className="review-text">"{review.text}"</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Perry Assistant - Non-breaking addition */}
        <PerryAssistant 
          currentStep={currentStep}
          selectedPackage={selectedPackage}
          selectedAddons={selectedAddons}
          clientInfo={clientInfo}
        />

      </div>
    </div>
  );
}

export default App;
