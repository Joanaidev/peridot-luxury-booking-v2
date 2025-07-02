// FIXED HST Auto-Calculation for Admin Dashboard
const calculateMonthlyHSTReport = (bookings) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get confirmed and paid bookings for current month
  const thisMonthBookings = bookings.filter(booking => {
    if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') return false;
    const bookingDate = new Date(booking.createdAt);
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  });
  
  // Calculate HST breakdown for each booking
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