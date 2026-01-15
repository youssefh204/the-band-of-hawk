/**
 * Payment Calculator Utility
 * Calculates participation fees for bazaars and booths
 */

/**
 * Calculate payment amount for a booth application
 * Based on duration (weeks) and location
 * @param {Number} duration - Duration in weeks (1-4)
 * @param {String} location - Location of the booth
 * @returns {Number} - Payment amount in EGP
 */
export const calculateBoothFee = (duration, location) => {
  // Base price per week in EGP
  const basePricePerWeek = 500; // Placeholder: 500 EGP per week
  
  // Location multipliers
  const locationMultipliers = {
    'GUC Cairo': 1.0,      // Standard rate
    'GUC Berlin': 1.5,     // 50% premium for Berlin
    'Main Campus': 1.2,    // 20% premium for main campus
    'Other': 1.0           // Default
  };
  
  const multiplier = locationMultipliers[location] || 1.0;
  const totalAmount = basePricePerWeek * duration * multiplier;
  
  return Math.round(totalAmount);
};

/**
 * Calculate payment amount for a bazaar application
 * Based on booth size and location
 * @param {String} boothSize - Booth size ('2x2' or '4x4')
 * @param {String} location - Location of the bazaar
 * @returns {Number} - Payment amount in EGP
 */
export const calculateBazaarFee = (boothSize, location) => {
  // Base prices for booth sizes in EGP
  const boothPrices = {
    '2x2': 1000,  // Placeholder: 1000 EGP for 2x2 booth
    '4x4': 2000   // Placeholder: 2000 EGP for 4x4 booth
  };
  
  // Location multipliers
  const locationMultipliers = {
    'GUC Cairo': 1.0,      // Standard rate
    'GUC Berlin': 1.5,     // 50% premium for Berlin
    'Other': 1.0           // Default
  };
  
  const basePrice = boothPrices[boothSize] || boothPrices['2x2'];
  const multiplier = locationMultipliers[location] || 1.0;
  const totalAmount = basePrice * multiplier;
  
  return Math.round(totalAmount);
};

/**
 * Calculate payment amount based on application type
 * @param {Object} application - Application object with type, boothSize, duration, location, bazaarId
 * @param {Object} bazaar - Bazaar object (if application type is 'bazaar')
 * @returns {Number} - Payment amount in EGP
 */
export const calculatePaymentAmount = (application, bazaar = null) => {
  if (application.type === 'booth') {
    return calculateBoothFee(application.duration, application.location);
  } else if (application.type === 'bazaar') {
    const location = bazaar?.location || 'GUC Cairo';
    return calculateBazaarFee(application.boothSize, location);
  }
  
  return 0;
};

