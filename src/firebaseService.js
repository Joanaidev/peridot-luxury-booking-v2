import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

// Check if Firebase is available
const isFirebaseAvailable = () => {
  return db !== null;
};

// Bookings
export const addBooking = async (bookingData) => {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase is not available');
  }
  
  try {
    const docRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      createdAt: serverTimestamp(),
      status: bookingData.status || 'pending'
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding booking: ", error);
    throw error;
  }
};

export const getBookings = async () => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase not available, returning empty bookings array');
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, "bookings"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting bookings: ", error);
    return [];
  }
};

export const updateBookingStatus = async (bookingId, newStatus, paymentStatus = null, extraData = {}) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const updateData = { 
      status: newStatus, 
      updatedAt: serverTimestamp(),
      ...extraData 
    };
    if (paymentStatus !== null) {
      updateData.paymentStatus = paymentStatus;
    }
    await updateDoc(bookingRef, updateData);
  } catch (error) {
    console.error("Error updating booking: ", error);
    throw error;
  }
};

export const deleteBooking = async (bookingId) => {
  try {
    await deleteDoc(doc(db, "bookings", bookingId));
  } catch (error) {
    console.error("Error deleting booking: ", error);
    throw error;
  }
};

// Discount Codes
export const addDiscountCode = async (discountData) => {
  try {
    const docRef = await addDoc(collection(db, "discountCodes"), {
      ...discountData,
      createdAt: serverTimestamp(),
      isActive: true
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding discount code: ", error);
    throw error;
  }
};

export const getDiscountCodes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "discountCodes"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting discount codes: ", error);
    throw error;
  }
};

export const updateDiscountCode = async (discountId, updateData) => {
  try {
    const discountRef = doc(db, "discountCodes", discountId);
    await updateDoc(discountRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating discount code: ", error);
    throw error;
  }
};

export const deleteDiscountCode = async (discountId) => {
  try {
    await deleteDoc(doc(db, "discountCodes", discountId));
  } catch (error) {
    console.error("Error deleting discount code: ", error);
    throw error;
  }
};

export const getDiscountCodeByCode = async (code) => {
  try {
    const q = query(collection(db, "discountCodes"), where("code", "==", code));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting discount code: ", error);
    throw error;
  }
};

// Admin Notifications
export const addAdminNotification = async (notificationData) => {
  try {
    const docRef = await addDoc(collection(db, "adminNotifications"), {
      ...notificationData,
      createdAt: serverTimestamp(),
      isRead: false
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding notification: ", error);
    throw error;
  }
};

export const getAdminNotifications = async () => {
  try {
    const q = query(collection(db, "adminNotifications"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting notifications: ", error);
    throw error;
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, "adminNotifications", notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error marking notification read: ", error);
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, "adminNotifications", notificationId));
  } catch (error) {
    console.error("Error deleting notification: ", error);
    throw error;
  }
};

// Packages and Categories
export const addPackage = async (packageData) => {
  try {
    const docRef = await addDoc(collection(db, "packages"), {
      ...packageData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding package: ", error);
    throw error;
  }
};

export const getPackages = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "packages"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting packages: ", error);
    throw error;
  }
};

export const updatePackage = async (packageId, updateData) => {
  try {
    const packageRef = doc(db, "packages", packageId);
    await updateDoc(packageRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating package: ", error);
    throw error;
  }
};

export const deletePackage = async (packageId) => {
  try {
    await deleteDoc(doc(db, "packages", packageId));
  } catch (error) {
    console.error("Error deleting package: ", error);
    throw error;
  }
};

// Reviews
export const addReview = async (reviewData) => {
  try {
    const docRef = await addDoc(collection(db, "reviews"), {
      ...reviewData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding review: ", error);
    throw error;
  }
};

export const getReviews = async () => {
  try {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting reviews: ", error);
    throw error;
  }
};

export const updateReview = async (reviewId, updateData) => {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating review: ", error);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    await deleteDoc(doc(db, "reviews", reviewId));
  } catch (error) {
    console.error("Error deleting review: ", error);
    throw error;
  }
};

// Settings (Email, Theme, etc.)
export const saveSettings = async (settingsType, settingsData) => {
  try {
    // For settings, we'll use a single document per type
    const settingsRef = doc(db, "settings", settingsType);
    await updateDoc(settingsRef, {
      ...settingsData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await addDoc(collection(db, "settings"), {
        type: settingsType,
        ...settingsData,
        createdAt: serverTimestamp()
      });
    } catch (createError) {
      console.error("Error creating settings: ", createError);
      throw createError;
    }
  }
};

export const getSettings = async (settingsType) => {
  try {
    const q = query(collection(db, "settings"), where("type", "==", settingsType));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting settings: ", error);
    throw error;
  }
};

// Blocked Dates and Time Slots
export const saveBlockedDates = async (blockedDates) => {
  try {
    const settingsRef = doc(db, "settings", "blockedDates");
    await updateDoc(settingsRef, {
      dates: blockedDates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await addDoc(collection(db, "settings"), {
        type: "blockedDates",
        dates: blockedDates,
        createdAt: serverTimestamp()
      });
    } catch (createError) {
      console.error("Error creating blocked dates: ", createError);
      throw createError;
    }
  }
};

export const getBlockedDates = async () => {
  try {
    const q = query(collection(db, "settings"), where("type", "==", "blockedDates"));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.data().dates || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting blocked dates: ", error);
    return [];
  }
};

export const saveBlockedTimeSlots = async (blockedTimeSlots) => {
  try {
    const settingsRef = doc(db, "settings", "blockedTimeSlots");
    await updateDoc(settingsRef, {
      timeSlots: blockedTimeSlots,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await addDoc(collection(db, "settings"), {
        type: "blockedTimeSlots",
        timeSlots: blockedTimeSlots,
        createdAt: serverTimestamp()
      });
    } catch (createError) {
      console.error("Error creating blocked time slots: ", createError);
      throw createError;
    }
  }
};

export const getBlockedTimeSlots = async () => {
  try {
    const q = query(collection(db, "settings"), where("type", "==", "blockedTimeSlots"));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.data().timeSlots || {};
    }
    return {};
  } catch (error) {
    console.error("Error getting blocked time slots: ", error);
    return {};
  }
};

// Real-time listeners
export const subscribeToBookings = (callback) => {
  return onSnapshot(collection(db, "bookings"), (snapshot) => {
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(bookings);
  });
};

export const subscribeToNotifications = (callback) => {
  const q = query(collection(db, "adminNotifications"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(notifications);
  });
}; 