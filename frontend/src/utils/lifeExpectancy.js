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
// 1 = bardzo źle (brak aktywności), 5 = bardzo dobrze (regularna intensywna)
const PHYSICAL_ACTIVITY_MODIFIER = {
  1: -4,    // Brak aktywności: -4 lata
  2: -2,    // Mała aktywność: -2 lata
  3: 0,     // Umiarkowana: bazowo
  4: +2,    // Dobra: +2 lata
  5: +3.5   // Bardzo dobra: +3.5 lat
};

// Modyfikatory dla jakości snu (1-5)
// 1 = bardzo źle (<5h lub bardzo zły), 5 = bardzo dobrze (7-8h, dobry)
const SLEEP_QUALITY_MODIFIER = {
  1: -3.5,  // Bardzo zły sen: -3.5 lat
  2: -2,    // Zły sen: -2 lata
  3: -0.5,  // Umiarkowany: -0.5 roku
  4: 0,     // Dobry (optymalny): bazowo
  5: 0      // Bardzo dobry: bazowo (nie ma "bonusu" za nadmiar)
};

// Modyfikatory dla jakości odżywiania (1-5)
const NUTRITION_MODIFIER = {
  1: -5,    // Bardzo zła dieta: -5 lat
  2: -2.5,  // Zła dieta: -2.5 lat
  3: 0,     // Umiarkowana: bazowo
  4: +1.5,  // Dobra: +1.5 roku
  5: +3     // Bardzo dobra (śródziemnomorska): +3 lata
};

// Modyfikatory dla poziomu stresu (1-5)
// UWAGA: W formularzu 1 = "bardzo źle" = wysoki stres
const STRESS_MODIFIER = {
  1: -2.5,  // Bardzo wysoki stres: -2.5 lat
  2: -1.5,  // Wysoki stres: -1.5 roku
  3: -0.5,  // Umiarkowany stres: -0.5 roku
  4: 0,     // Niski stres: bazowo
  5: +0.5   // Bardzo niski stres: +0.5 roku
};

// Modyfikatory dla palenia (1-3)
// 1 = nigdy, 2 = okazjonalnie, 3 = często
const SMOKING_MODIFIER = {
  1: 0,     // Nigdy: brak wpływu
  2: -4,    // Okazjonalnie: -4 lata
  3: -10    // Często/codziennie: -10 lat
};

// Modyfikatory dla alkoholu (1-3)
// 1 = nigdy, 2 = okazjonalnie, 3 = często
const ALCOHOL_MODIFIER = {
  1: 0,     // Nigdy: brak wpływu
  2: -0.5,  // Okazjonalnie: -0.5 roku (kontrowersyjne, bezpieczniej zakładać lekki minus)
  3: -6     // Często/nadużywanie: -6 lat
};

/**
 * Oblicza oczekiwaną długość życia na podstawie danych z formularza
 * @param {Object} formData - Dane z formularza
 * @returns {Object} - Szczegółowy wynik obliczeń
 */
export function calculateLifeExpectancy(formData) {
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

  // Bazowa długość życia
  const baseExpectancy = BASE_LIFE_EXPECTANCY[gender] || 77; // średnia jeśli nie podano płci

  // Oblicz modyfikatory
  const modifiers = {
    physicalActivity: PHYSICAL_ACTIVITY_MODIFIER[physicalActivity] || 0,
    sleepQuality: SLEEP_QUALITY_MODIFIER[sleepQuality] || 0,
    nutrition: NUTRITION_MODIFIER[nutrition] || 0,
    stressLevel: STRESS_MODIFIER[stressLevel] || 0,
    smoking: SMOKING_MODIFIER[smoking] || 0,
    alcohol: ALCOHOL_MODIFIER[alcohol] || 0
  };

  // Suma modyfikatorów
  const totalModifier = Object.values(modifiers).reduce((sum, val) => sum + val, 0);

  // Oczekiwana długość życia
  const expectedLifespan = Math.round((baseExpectancy + totalModifier) * 10) / 10;

  // Oblicz wiek na podstawie daty urodzenia
  const birthDateObj = new Date(birthDate);
  const today = new Date();
  let currentAge = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    currentAge--;
  }

  // Szacowana data śmierci
  const expectedDeathYear = birthDateObj.getFullYear() + Math.round(expectedLifespan);
  
  // Pozostałe lata życia
  const remainingYears = Math.max(0, Math.round((expectedLifespan - currentAge) * 10) / 10);

  // Pozostałe tygodnie (dla kalendarza)
  const remainingWeeks = Math.max(0, Math.round(remainingYears * 52));

  // Przeżyte tygodnie
  const livedWeeks = Math.round(currentAge * 52);

  // Całkowita liczba tygodni życia
  const totalWeeks = Math.round(expectedLifespan * 52);

  return {
    // Podstawowe dane
    currentAge,
    expectedLifespan,
    remainingYears,
    expectedDeathYear,

    // Dane dla kalendarza (w tygodniach)
    livedWeeks,
    remainingWeeks,
    totalWeeks,

    // Szczegóły obliczeń
    baseExpectancy,
    modifiers,
    totalModifier,

    // Analiza wpływu czynników
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

/**
 * Formatuje wpływ czynnika jako tekst
 * @param {number} impact - Wpływ w latach
 * @returns {string} - Sformatowany tekst
 */
export function formatImpact(impact) {
  if (impact === 0) return '±0 lat';
  if (impact > 0) return `+${impact} ${impact === 1 ? 'rok' : impact < 5 ? 'lata' : 'lat'}`;
  return `${impact} ${Math.abs(impact) === 1 ? 'rok' : Math.abs(impact) < 5 ? 'lata' : 'lat'}`;
}

/**
 * Generuje podsumowanie tekstowe
 * @param {Object} result - Wynik z calculateLifeExpectancy
 * @returns {string} - Podsumowanie
 */
export function generateSummary(result) {
  const { currentAge, expectedLifespan, remainingYears, factors } = result;
  
  const positiveFactors = factors.filter(f => f.impact > 0);
  const negativeFactors = factors.filter(f => f.impact < 0);
  
  let summary = `Na podstawie Twoich odpowiedzi, szacowana długość życia to około ${expectedLifespan} lat. `;
  summary += `Masz obecnie ${currentAge} lat, co oznacza około ${remainingYears} lat przed Tobą.\n\n`;
  
  if (positiveFactors.length > 0) {
    summary += `✅ Pozytywny wpływ: ${positiveFactors.map(f => f.name).join(', ')}\n`;
  }
  
  if (negativeFactors.length > 0) {
    summary += `⚠️ Do poprawy: ${negativeFactors.map(f => f.name).join(', ')}`;
  }
  
  return summary;
}

export default calculateLifeExpectancy;
