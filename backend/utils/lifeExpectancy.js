/**
 * Algorytm szacowania oczekiwanej długości życia
 * Oparty na badaniach naukowych i danych statystycznych
 * 
 * Źródła:
 * - GUS 2023 (średnia długość życia w Polsce)
 * - Doll et al. 2004 (palenie)
 * - Lee et al. 2012, Lancet (aktywność fizyczna)
 * - Cappuccio et al. 2010 (sen)
 * - PREDIMED Study (dieta)
 * - Rosengren et al. 2004, Lancet (stres)
 * - Lancet 2018 (alkohol)
 */

// Bazowa oczekiwana długość życia (Polska 2023)
const BASE_LIFE_EXPECTANCY = {
  female: 81,
  male: 74
};

// Modyfikatory dla aktywności fizycznej (1-5)
const PHYSICAL_ACTIVITY_MODIFIER = {
  1: -4,
  2: -2,
  3: 0,
  4: +2,
  5: +3.5
};

// Modyfikatory dla jakości snu (1-5)
const SLEEP_QUALITY_MODIFIER = {
  1: -3.5,
  2: -2,
  3: -0.5,
  4: 0,
  5: 0
};

// Modyfikatory dla jakości odżywiania (1-5)
const NUTRITION_MODIFIER = {
  1: -5,
  2: -2.5,
  3: 0,
  4: +1.5,
  5: +3
};

// Modyfikatory dla poziomu stresu (1-5)
const STRESS_MODIFIER = {
  1: -2.5,
  2: -1.5,
  3: -0.5,
  4: 0,
  5: +0.5
};

// Modyfikatory dla palenia (1-3)
const SMOKING_MODIFIER = {
  1: 0,
  2: -4,
  3: -10
};

// Modyfikatory dla alkoholu (1-3)
const ALCOHOL_MODIFIER = {
  1: 0,
  2: -0.5,
  3: -6
};

/**
 * Oblicza oczekiwaną długość życia na podstawie danych z formularza
 */
function calculateLifeExpectancy(formData) {
  const {
    birthDate,
    gender,
    sleepQuality,
    physicalActivity,
    nutrition,
    stressLevel,
    smoking,
    alcohol
  } = formData;

  const baseExpectancy = BASE_LIFE_EXPECTANCY[gender] || 77;

  const modifiers = {
    physicalActivity: PHYSICAL_ACTIVITY_MODIFIER[physicalActivity] || 0,
    sleepQuality: SLEEP_QUALITY_MODIFIER[sleepQuality] || 0,
    nutrition: NUTRITION_MODIFIER[nutrition] || 0,
    stressLevel: STRESS_MODIFIER[stressLevel] || 0,
    smoking: SMOKING_MODIFIER[smoking] || 0,
    alcohol: ALCOHOL_MODIFIER[alcohol] || 0
  };

  const totalModifier = Object.values(modifiers).reduce((sum, val) => sum + val, 0);
  const expectedLifespan = Math.round((baseExpectancy + totalModifier) * 10) / 10;

  const birthDateObj = new Date(birthDate);
  const today = new Date();
  let currentAge = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    currentAge--;
  }

  const expectedDeathYear = birthDateObj.getFullYear() + Math.round(expectedLifespan);
  const remainingYears = Math.max(0, Math.round((expectedLifespan - currentAge) * 10) / 10);
  const remainingWeeks = Math.max(0, Math.round(remainingYears * 52));
  const livedWeeks = Math.round(currentAge * 52);
  const totalWeeks = Math.round(expectedLifespan * 52);

  return {
    currentAge,
    expectedLifespan,
    remainingYears,
    expectedDeathYear,
    livedWeeks,
    remainingWeeks,
    totalWeeks,
    baseExpectancy,
    modifiers,
    totalModifier,
    factors: [
      {
        name: 'Aktywność fizyczna',
        value: physicalActivity,
        impact: modifiers.physicalActivity,
        isPositive: modifiers.physicalActivity >= 0
      },
      {
        name: 'Jakość snu',
        value: sleepQuality,
        impact: modifiers.sleepQuality,
        isPositive: modifiers.sleepQuality >= 0
      },
      {
        name: 'Odżywianie',
        value: nutrition,
        impact: modifiers.nutrition,
        isPositive: modifiers.nutrition >= 0
      },
      {
        name: 'Poziom stresu',
        value: stressLevel,
        impact: modifiers.stressLevel,
        isPositive: modifiers.stressLevel >= 0
      },
      {
        name: 'Palenie tytoniu',
        value: smoking,
        impact: modifiers.smoking,
        isPositive: modifiers.smoking >= 0
      },
      {
        name: 'Alkohol',
        value: alcohol,
        impact: modifiers.alcohol,
        isPositive: modifiers.alcohol >= 0
      }
    ]
  };
}

module.exports = { calculateLifeExpectancy };
