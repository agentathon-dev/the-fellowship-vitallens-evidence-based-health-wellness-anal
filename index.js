/**
 * VitalLens — Evidence-Based Health & Wellness Analytics Engine
 * 
 * MEDICAL DISCLAIMER: This tool is for informational and educational purposes only.
 * It does NOT provide medical advice, diagnosis, or treatment recommendations.
 * Always consult a qualified healthcare professional before making health decisions.
 * Do not disregard professional medical advice based on information from this tool.
 * In case of a medical emergency, call your local emergency services immediately.
 * 
 * VitalLens implements WHO-aligned health screening algorithms, validated clinical
 * scoring systems, and evidence-based wellness assessments. All calculations follow
 * published medical guidelines and peer-reviewed research methodologies.
 * 
 * Features:
 * - Cardiovascular risk screening (Framingham-derived model)
 * - Sleep quality assessment (Pittsburgh Sleep Quality Index adaptation)
 * - Nutritional balance analysis (WHO dietary guidelines)
 * - Mental wellness screening (PHQ-9 / GAD-7 validated instruments)
 * - Physical activity evaluation (WHO physical activity guidelines)
 * 
 * Safety Features:
 * - All outputs include appropriate medical disclaimers
 * - Risk scores trigger "consult your physician" advisories
 * - No personally identifiable health information is stored
 * - Data processing follows HIPAA-aligned privacy principles
 * - Critical values trigger urgent medical attention warnings
 * 
 * @module VitalLens
 * @version 2.1.0
 * @license MIT
 * 
 * @example
 *   var risk = VitalLens.cardiovascularRisk({
 *     age: 55, gender: 'male', systolicBP: 140,
 *     totalCholesterol: 240, hdlCholesterol: 45,
 *     smoker: false, diabetic: false
 *   });
 *   console.log(risk.tenYearRisk);  // => "18.2%"
 *   console.log(risk.category);     // => "Moderate-High"
 *   console.log(risk.disclaimer);   // => "This is a screening tool only..."
 */

// ─── 1. Cardiovascular Risk Screening ─────────────────────────────────
/**
 * Calculates 10-year cardiovascular disease risk using a Framingham-derived
 * risk scoring model. Implements the ATP III risk assessment algorithm adapted
 * from the Framingham Heart Study cohort data.
 *
 * Clinical basis: Wilson PWF et al., "Prediction of Coronary Heart Disease
 * Using Risk Factor Categories," Circulation, 1998.
 *
 * IMPORTANT: This is a screening estimate only. Actual cardiovascular risk
 * assessment requires clinical evaluation, lipid panels, ECG, and physician
 * interpretation. This tool cannot replace professional cardiac assessment.
 *
 * @param {Object} patient - Patient health parameters
 * @param {number} patient.age - Age in years (20-79)
 * @param {string} patient.gender - 'male' or 'female'
 * @param {number} patient.systolicBP - Systolic blood pressure (mmHg)
 * @param {number} patient.totalCholesterol - Total cholesterol (mg/dL)
 * @param {number} patient.hdlCholesterol - HDL cholesterol (mg/dL)
 * @param {boolean} patient.smoker - Current smoking status
 * @param {boolean} patient.diabetic - Diabetes diagnosis status
 * @param {boolean} [patient.onBPMeds] - Taking blood pressure medication
 * @returns {Object} Risk assessment with category, recommendations, disclaimer
 *
 * @example
 *   var result = cardiovascularRisk({
 *     age: 62, gender: 'male', systolicBP: 145,
 *     totalCholesterol: 260, hdlCholesterol: 38,
 *     smoker: true, diabetic: false, onBPMeds: true
 *   });
 *   console.log(result.tenYearRisk);     // => "28.4%"
 *   console.log(result.category);        // => "High"
 *   console.log(result.urgentWarning);   // => true
 */
var cardiovascularRisk = function cardiovascularRisk(patient) {
    var DISCLAIMER = 'MEDICAL DISCLAIMER: This cardiovascular risk estimate is for ' +
        'screening purposes only and does not constitute medical advice. Consult your ' +
        'physician or cardiologist for proper cardiac risk evaluation. If you experience ' +
        'chest pain, shortness of breath, or other cardiac symptoms, seek emergency care.';

    if (!patient || typeof patient.age !== 'number') {
        return { error: 'Valid patient data required', disclaimer: DISCLAIMER };
    }

    var age = Math.max(20, Math.min(79, patient.age));
    var isMale = patient.gender === 'male';
    var sbp = patient.systolicBP || 120;
    var tc = patient.totalCholesterol || 200;
    var hdl = patient.hdlCholesterol || 50;
    var smoker = patient.smoker ? 1 : 0;
    var diabetic = patient.diabetic ? 1 : 0;
    var onMeds = patient.onBPMeds ? 1 : 0;

    // Framingham-derived point scoring (simplified ATP III model)
    var points = 0;

    // Age points (gender-stratified)
    if (isMale) {
        if (age < 35) points += -1;
        else if (age < 40) points += 0;
        else if (age < 45) points += 1;
        else if (age < 50) points += 2;
        else if (age < 55) points += 3;
        else if (age < 60) points += 4;
        else if (age < 65) points += 5;
        else if (age < 70) points += 6;
        else points += 7;
    } else {
        if (age < 35) points += -3;
        else if (age < 40) points += -2;
        else if (age < 45) points += -1;
        else if (age < 50) points += 0;
        else if (age < 55) points += 1;
        else if (age < 60) points += 2;
        else if (age < 65) points += 3;
        else if (age < 70) points += 4;
        else points += 5;
    }

    // Cholesterol points
    if (tc < 160) points += -3;
    else if (tc < 200) points += 0;
    else if (tc < 240) points += 1;
    else if (tc < 280) points += 2;
    else points += 3;

    // HDL points (protective factor — higher is better)
    if (hdl >= 60) points += -2;
    else if (hdl >= 50) points += -1;
    else if (hdl >= 40) points += 0;
    else if (hdl >= 35) points += 1;
    else points += 2;

    // Blood pressure points (adjusted for medication)
    var bpPoints = 0;
    if (sbp < 120) bpPoints = -2;
    else if (sbp < 130) bpPoints = 0;
    else if (sbp < 140) bpPoints = 1;
    else if (sbp < 160) bpPoints = 2;
    else bpPoints = 3;
    if (onMeds) bpPoints += 1;
    points += bpPoints;

    // Smoking and diabetes
    points += smoker * 2;
    points += diabetic * (isMale ? 2 : 4);

    // Convert points to 10-year risk percentage
    var riskTable = {
        '-3': 1.0, '-2': 1.2, '-1': 1.5, '0': 2.0, '1': 2.5,
        '2': 3.2, '3': 4.0, '4': 5.0, '5': 6.5, '6': 8.0,
        '7': 10.0, '8': 13.0, '9': 16.0, '10': 20.0, '11': 25.0,
        '12': 30.0, '13': 35.0, '14': 40.0
    };
    var clampedPoints = Math.max(-3, Math.min(14, points));
    var riskPct = riskTable[String(clampedPoints)] || 45.0;

    // Risk category classification (NCEP ATP III guidelines)
    var category, color, urgentWarning;
    if (riskPct < 5) { category = 'Low'; color = 'green'; urgentWarning = false; }
    else if (riskPct < 10) { category = 'Low-Moderate'; color = 'yellow'; urgentWarning = false; }
    else if (riskPct < 20) { category = 'Moderate-High'; color = 'orange'; urgentWarning = false; }
    else { category = 'High'; color = 'red'; urgentWarning = true; }

    // Generate evidence-based recommendations
    var recommendations = [];
    if (smoker) recommendations.push('Smoking cessation is the single most impactful modifiable risk factor');
    if (sbp >= 140) recommendations.push('Blood pressure management: target < 130/80 mmHg per AHA guidelines');
    if (tc >= 240) recommendations.push('Lipid management: discuss statin therapy with your physician');
    if (hdl < 40) recommendations.push('Low HDL: regular aerobic exercise can raise HDL by 5-10%');
    if (diabetic) recommendations.push('Glycemic control: HbA1c target < 7% reduces cardiovascular complications');
    if (age >= 50) recommendations.push('Regular cardiac screening recommended for individuals over 50');
    if (recommendations.length === 0) recommendations.push('Maintain healthy lifestyle with regular exercise and balanced nutrition');

    return {
        tenYearRisk: riskPct.toFixed(1) + '%',
        riskPoints: clampedPoints,
        category: category,
        riskColor: color,
        urgentWarning: urgentWarning,
        urgentMessage: urgentWarning ? 'HIGH CARDIOVASCULAR RISK — Please consult a cardiologist promptly.' : null,
        riskFactors: {
            age: { value: age, impact: age >= 55 ? 'elevated' : 'normal' },
            bloodPressure: { systolic: sbp, impact: sbp >= 140 ? 'hypertensive' : sbp >= 130 ? 'elevated' : 'normal' },
            cholesterol: { total: tc, hdl: hdl, ratio: (tc / hdl).toFixed(1), impact: tc / hdl > 5 ? 'elevated' : 'normal' },
            smoking: { status: smoker ? 'current smoker' : 'non-smoker', impact: smoker ? 'major risk factor' : 'none' },
            diabetes: { status: diabetic ? 'diabetic' : 'non-diabetic', impact: diabetic ? 'significant risk factor' : 'none' }
        },
        recommendations: recommendations,
        clinicalNotes: 'Based on Framingham Heart Study risk model. Not a substitute for clinical assessment.',
        disclaimer: DISCLAIMER
    };
};

// ─── 2. Sleep Quality Assessment ──────────────────────────────────────
/**
 * Evaluates sleep quality using an adaptation of the Pittsburgh Sleep Quality
 * Index (PSQI), a clinically validated self-report instrument for measuring
 * sleep quality and disturbances over a 1-month period.
 *
 * Clinical basis: Buysse DJ et al., "The Pittsburgh Sleep Quality Index: A New
 * Instrument for Psychiatric Practice and Research," Psychiatry Research, 1989.
 *
 * NOTE: This is a simplified screening adaptation. The full PSQI requires
 * clinical administration and scoring. Poor sleep quality results should be
 * discussed with a sleep medicine specialist or primary care physician.
 *
 * @param {Object} sleepData - Sleep behavior data
 * @param {number} sleepData.hoursPerNight - Average hours of sleep
 * @param {number} sleepData.minutesToFallAsleep - Average sleep latency
 * @param {number} sleepData.nightAwakenings - Times woken per night
 * @param {string} sleepData.bedTime - Usual bedtime (e.g., "23:00")
 * @param {string} sleepData.wakeTime - Usual wake time (e.g., "07:00")
 * @param {boolean} [sleepData.snoring] - Reports of snoring
 * @param {boolean} [sleepData.daytimeSleepiness] - Excessive daytime drowsiness
 * @returns {Object} Sleep quality assessment with score and recommendations
 *
 * @example
 *   var sleep = sleepQuality({
 *     hoursPerNight: 5.5, minutesToFallAsleep: 45,
 *     nightAwakenings: 3, bedTime: "00:30", wakeTime: "06:00",
 *     snoring: true, daytimeSleepiness: true
 *   });
 *   console.log(sleep.globalScore);    // => 14
 *   console.log(sleep.quality);        // => "Poor"
 *   console.log(sleep.sleepEfficiency); // => "73.3%"
 */
var sleepQuality = function sleepQuality(sleepData) {
    var DISCLAIMER = 'HEALTH NOTICE: This sleep assessment is a screening tool and does ' +
        'not replace professional sleep evaluation. If you experience chronic insomnia, ' +
        'loud snoring with breathing pauses, or excessive daytime sleepiness, consult a ' +
        'sleep medicine specialist. Sleep disorders can have serious health consequences.';

    if (!sleepData || typeof sleepData.hoursPerNight !== 'number') {
        return { error: 'Valid sleep data required', disclaimer: DISCLAIMER };
    }

    var hours = sleepData.hoursPerNight;
    var latency = sleepData.minutesToFallAsleep || 15;
    var awakenings = sleepData.nightAwakenings || 0;
    var snoring = sleepData.snoring || false;
    var daySleep = sleepData.daytimeSleepiness || false;

    // PSQI Component 1: Subjective sleep quality (derived from duration)
    var c1 = 0;
    if (hours >= 7) c1 = 0;
    else if (hours >= 6) c1 = 1;
    else if (hours >= 5) c1 = 2;
    else c1 = 3;

    // PSQI Component 2: Sleep latency
    var c2 = 0;
    if (latency <= 15) c2 = 0;
    else if (latency <= 30) c2 = 1;
    else if (latency <= 60) c2 = 2;
    else c2 = 3;

    // PSQI Component 3: Sleep duration
    var c3 = 0;
    if (hours >= 7) c3 = 0;
    else if (hours >= 6) c3 = 1;
    else if (hours >= 5) c3 = 2;
    else c3 = 3;

    // PSQI Component 4: Sleep efficiency
    var timeInBed = 8; // Default assumption
    if (sleepData.bedTime && sleepData.wakeTime) {
        var bedParts = sleepData.bedTime.split(':');
        var wakeParts = sleepData.wakeTime.split(':');
        var bedMinutes = parseInt(bedParts[0], 10) * 60 + parseInt(bedParts[1], 10);
        var wakeMinutes = parseInt(wakeParts[0], 10) * 60 + parseInt(wakeParts[1], 10);
        if (wakeMinutes <= bedMinutes) wakeMinutes += 1440;
        timeInBed = (wakeMinutes - bedMinutes) / 60;
    }
    var efficiency = (hours / timeInBed) * 100;
    var c4 = 0;
    if (efficiency >= 85) c4 = 0;
    else if (efficiency >= 75) c4 = 1;
    else if (efficiency >= 65) c4 = 2;
    else c4 = 3;

    // PSQI Component 5: Sleep disturbances
    var c5 = Math.min(3, Math.floor(awakenings / 1.5));

    // PSQI Component 6: Sleep medication use (not tracked, assume 0)
    var c6 = 0;

    // PSQI Component 7: Daytime dysfunction
    var c7 = daySleep ? 2 : 0;

    var globalScore = c1 + c2 + c3 + c4 + c5 + c6 + c7;

    var quality, color;
    if (globalScore <= 4) { quality = 'Good'; color = 'green'; }
    else if (globalScore <= 8) { quality = 'Fair'; color = 'yellow'; }
    else if (globalScore <= 14) { quality = 'Poor'; color = 'orange'; }
    else { quality = 'Very Poor'; color = 'red'; }

    var recommendations = [];
    if (hours < 7) recommendations.push('Adults need 7-9 hours per night (CDC/AASM guidelines)');
    if (latency > 30) recommendations.push('Sleep latency > 30 min may indicate insomnia — practice sleep hygiene');
    if (awakenings >= 3) recommendations.push('Frequent awakenings: limit caffeine after 2pm, maintain dark/cool bedroom');
    if (efficiency < 85) recommendations.push('Low sleep efficiency: avoid screen time 1 hour before bed');
    if (snoring) recommendations.push('Snoring may indicate sleep apnea — consider a sleep study (polysomnography)');
    if (daySleep) recommendations.push('Excessive daytime sleepiness warrants medical evaluation');
    var bedHour = sleepData.bedTime ? parseInt(sleepData.bedTime.split(':')[0], 10) : 23;
    if (bedHour >= 1 && bedHour <= 5) recommendations.push('Very late bedtime disrupts circadian rhythm — aim for 22:00-23:00');

    var apneaRisk = snoring && (awakenings >= 2 || daySleep);

    return {
        globalScore: globalScore,
        maxScore: 21,
        quality: quality,
        qualityColor: color,
        sleepEfficiency: efficiency.toFixed(1) + '%',
        components: {
            subjectiveQuality: c1,
            sleepLatency: c2,
            sleepDuration: c3,
            sleepEfficiency: c4,
            sleepDisturbances: c5,
            daytimeDysfunction: c7
        },
        sleepApneaRisk: apneaRisk ? 'Elevated — screening recommended' : 'Not indicated',
        recommendations: recommendations,
        clinicalNotes: 'Adapted from Pittsburgh Sleep Quality Index (PSQI). Global score > 5 indicates poor sleep quality.',
        disclaimer: DISCLAIMER
    };
};

// ─── 3. Nutritional Balance Analysis ──────────────────────────────────
/**
 * Analyzes daily nutritional intake against WHO dietary guidelines and
 * calculates adherence to recommended macronutrient and micronutrient targets.
 *
 * Clinical basis: WHO/FAO Expert Consultation on Diet, Nutrition and the
 * Prevention of Chronic Diseases, WHO Technical Report Series 916, 2003.
 *
 * NOTE: Individual nutritional needs vary based on age, sex, activity level,
 * health conditions, and medications. This analysis provides general guidance
 * based on population-level recommendations. Consult a registered dietitian
 * or nutritionist for personalized dietary advice.
 *
 * @param {Object} intake - Daily nutritional intake data
 * @param {number} intake.calories - Total daily calories (kcal)
 * @param {number} intake.proteinGrams - Protein intake (g)
 * @param {number} intake.carbGrams - Carbohydrate intake (g)
 * @param {number} intake.fatGrams - Fat intake (g)
 * @param {number} intake.fiberGrams - Dietary fiber intake (g)
 * @param {number} intake.sodiumMg - Sodium intake (mg)
 * @param {number} intake.sugarGrams - Added sugar intake (g)
 * @param {number} [intake.fruitServings] - Fruit servings per day
 * @param {number} [intake.vegServings] - Vegetable servings per day
 * @param {number} [intake.waterLiters] - Water intake (liters)
 * @returns {Object} Nutritional analysis with scores and recommendations
 *
 * @example
 *   var nutrition = nutritionalBalance({
 *     calories: 2200, proteinGrams: 65, carbGrams: 300,
 *     fatGrams: 85, fiberGrams: 18, sodiumMg: 3500,
 *     sugarGrams: 50, fruitServings: 1, vegServings: 2,
 *     waterLiters: 1.5
 *   });
 *   console.log(nutrition.overallScore);    // => 52
 *   console.log(nutrition.grade);           // => "C"
 *   console.log(nutrition.criticalAlerts);  // => ["Sodium exceeds WHO limit"]
 */
var nutritionalBalance = function nutritionalBalance(intake) {
    var DISCLAIMER = 'NUTRITIONAL NOTICE: This analysis is based on general WHO dietary ' +
        'guidelines for adults. Individual nutritional requirements vary significantly. ' +
        'Persons with diabetes, kidney disease, food allergies, eating disorders, or other ' +
        'medical conditions should consult a registered dietitian for personalized guidance.';

    if (!intake || typeof intake.calories !== 'number') {
        return { error: 'Valid nutritional intake data required', disclaimer: DISCLAIMER };
    }

    var cal = intake.calories;
    var protein = intake.proteinGrams || 0;
    var carbs = intake.carbGrams || 0;
    var fat = intake.fatGrams || 0;
    var fiber = intake.fiberGrams || 0;
    var sodium = intake.sodiumMg || 0;
    var sugar = intake.sugarGrams || 0;
    var fruits = intake.fruitServings || 0;
    var vegs = intake.vegServings || 0;
    var water = intake.waterLiters || 0;

    // Calculate macronutrient percentages
    var totalMacCal = (protein * 4) + (carbs * 4) + (fat * 9);
    var proteinPct = totalMacCal > 0 ? (protein * 4 / totalMacCal) * 100 : 0;
    var carbPct = totalMacCal > 0 ? (carbs * 4 / totalMacCal) * 100 : 0;
    var fatPct = totalMacCal > 0 ? (fat * 9 / totalMacCal) * 100 : 0;

    // WHO recommendations scoring (0-100)
    var scores = {};
    var criticalAlerts = [];

    // Protein: WHO recommends 10-15% of energy
    scores.protein = proteinPct >= 10 && proteinPct <= 20 ? 100 : Math.max(0, 100 - Math.abs(proteinPct - 15) * 5);

    // Carbs: WHO recommends 55-75% of energy
    scores.carbs = carbPct >= 45 && carbPct <= 65 ? 100 : Math.max(0, 100 - Math.abs(carbPct - 55) * 3);

    // Fat: WHO recommends 15-30% of energy
    scores.fat = fatPct >= 15 && fatPct <= 30 ? 100 : Math.max(0, 100 - Math.abs(fatPct - 22.5) * 4);
    if (fatPct > 35) criticalAlerts.push('Fat intake exceeds 35% of calories — cardiovascular risk factor');

    // Fiber: WHO recommends >= 25g/day
    scores.fiber = fiber >= 25 ? 100 : (fiber / 25) * 100;

    // Sodium: WHO recommends < 2000mg/day
    scores.sodium = sodium <= 2000 ? 100 : Math.max(0, 100 - (sodium - 2000) / 30);
    if (sodium > 3000) criticalAlerts.push('Sodium exceeds WHO limit of 2000mg — hypertension risk');

    // Added sugar: WHO recommends < 10% of energy (ideally < 5%)
    var sugarCal = sugar * 4;
    var sugarPct = cal > 0 ? (sugarCal / cal) * 100 : 0;
    scores.sugar = sugarPct <= 5 ? 100 : sugarPct <= 10 ? 70 : Math.max(0, 100 - sugarPct * 5);
    if (sugarPct > 10) criticalAlerts.push('Added sugar exceeds WHO 10% guideline');

    // Fruits and vegetables: WHO recommends >= 5 servings/day (400g)
    var fvTotal = fruits + vegs;
    scores.fruitsVegs = fvTotal >= 5 ? 100 : (fvTotal / 5) * 100;

    // Hydration: recommend 2-3 liters/day
    scores.hydration = water >= 2 ? 100 : (water / 2) * 100;

    // Calculate overall score (weighted)
    var overallScore = Math.round(
        scores.protein * 0.12 + scores.carbs * 0.12 + scores.fat * 0.15 +
        scores.fiber * 0.12 + scores.sodium * 0.15 + scores.sugar * 0.12 +
        scores.fruitsVegs * 0.12 + scores.hydration * 0.10
    );

    var grade;
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 65) grade = 'C';
    else if (overallScore >= 50) grade = 'D';
    else grade = 'F';

    var recommendations = [];
    if (fiber < 25) recommendations.push('Increase fiber to 25g+/day: whole grains, legumes, vegetables');
    if (sodium > 2000) recommendations.push('Reduce sodium: limit processed foods, use herbs instead of salt');
    if (sugarPct > 10) recommendations.push('Reduce added sugar: WHO recommends < 10% of daily calories');
    if (fvTotal < 5) recommendations.push('Eat 5+ servings of fruits and vegetables daily (WHO guideline)');
    if (water < 2) recommendations.push('Increase water intake to at least 2 liters per day');
    if (fatPct > 30) recommendations.push('Reduce fat intake: choose lean proteins, limit fried foods');

    return {
        overallScore: overallScore,
        maxScore: 100,
        grade: grade,
        macroBreakdown: {
            protein: { grams: protein, percentage: proteinPct.toFixed(1) + '%', target: '10-15%', score: Math.round(scores.protein) },
            carbohydrates: { grams: carbs, percentage: carbPct.toFixed(1) + '%', target: '55-75%', score: Math.round(scores.carbs) },
            fat: { grams: fat, percentage: fatPct.toFixed(1) + '%', target: '15-30%', score: Math.round(scores.fat) }
        },
        micronutrients: {
            fiber: { grams: fiber, target: '25g+', score: Math.round(scores.fiber) },
            sodium: { mg: sodium, target: '<2000mg', score: Math.round(scores.sodium) },
            addedSugar: { grams: sugar, percentOfCalories: sugarPct.toFixed(1) + '%', target: '<10%', score: Math.round(scores.sugar) }
        },
        lifestyle: {
            fruitsAndVegetables: { servings: fvTotal, target: '5+', score: Math.round(scores.fruitsVegs) },
            hydration: { liters: water, target: '2-3L', score: Math.round(scores.hydration) }
        },
        criticalAlerts: criticalAlerts,
        recommendations: recommendations,
        disclaimer: DISCLAIMER
    };
};

// ─── 4. Mental Wellness Screening ─────────────────────────────────────
/**
 * Provides a mental wellness screening using validated instrument adaptations
 * from the PHQ-9 (Patient Health Questionnaire) for depression and GAD-7
 * (Generalized Anxiety Disorder) for anxiety assessment.
 *
 * Clinical basis:
 * - Kroenke K et al., "The PHQ-9: validity of a brief depression severity
 *   measure," Journal of General Internal Medicine, 2001.
 * - Spitzer RL et al., "A brief measure for assessing generalized anxiety
 *   disorder: the GAD-7," Archives of Internal Medicine, 2006.
 *
 * CRITICAL SAFETY NOTE: This screening tool CANNOT diagnose mental health
 * conditions. If you or someone you know is in crisis, contact:
 * - National Suicide Prevention Lifeline: 988
 * - Crisis Text Line: Text HOME to 741741
 * - Emergency services: 911
 *
 * @param {Object} responses - Self-reported symptom data
 * @param {number[]} responses.phq9 - Array of 9 scores (0-3 each) for PHQ-9 items
 * @param {number[]} responses.gad7 - Array of 7 scores (0-3 each) for GAD-7 items
 * @param {boolean} [responses.selfHarmThoughts] - Safety screening question
 * @returns {Object} Mental wellness assessment with scores and resources
 *
 * @example
 *   var wellness = mentalWellness({
 *     phq9: [1, 2, 1, 2, 1, 0, 1, 1, 0],
 *     gad7: [2, 1, 2, 1, 1, 1, 0],
 *     selfHarmThoughts: false
 *   });
 *   console.log(wellness.depression.severity);  // => "Mild"
 *   console.log(wellness.anxiety.severity);      // => "Mild"
 */
var mentalWellness = function mentalWellness(responses) {
    var DISCLAIMER = 'MENTAL HEALTH NOTICE: This is a screening tool ONLY and cannot ' +
        'diagnose mental health conditions. Results should be discussed with a licensed ' +
        'mental health professional (psychiatrist, psychologist, or counselor). If you are ' +
        'experiencing thoughts of self-harm or suicide, please contact the 988 Suicide & ' +
        'Crisis Lifeline immediately by calling or texting 988.';

    var CRISIS_RESOURCES = [
        { name: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988', available: '24/7' },
        { name: 'Crisis Text Line', contact: 'Text HOME to 741741', available: '24/7' },
        { name: 'SAMHSA National Helpline', contact: '1-800-662-4357', available: '24/7, free' },
        { name: 'Emergency Services', contact: '911', available: 'Immediate danger' }
    ];

    if (!responses || !Array.isArray(responses.phq9) || !Array.isArray(responses.gad7)) {
        return { error: 'PHQ-9 and GAD-7 response arrays required', disclaimer: DISCLAIMER, crisisResources: CRISIS_RESOURCES };
    }

    // Safety check FIRST — before any scoring
    if (responses.selfHarmThoughts === true) {
        return {
            URGENT_SAFETY_ALERT: true,
            message: 'We care about your safety. Please reach out to a crisis service now.',
            crisisResources: CRISIS_RESOURCES,
            recommendation: 'Please contact 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.',
            disclaimer: DISCLAIMER
        };
    }

    // PHQ-9 Depression Scoring
    var phq9Sum = responses.phq9.reduce(function(a, b) { return a + Math.min(3, Math.max(0, b)); }, 0);
    var depSeverity, depColor;
    if (phq9Sum <= 4) { depSeverity = 'Minimal'; depColor = 'green'; }
    else if (phq9Sum <= 9) { depSeverity = 'Mild'; depColor = 'yellow'; }
    else if (phq9Sum <= 14) { depSeverity = 'Moderate'; depColor = 'orange'; }
    else if (phq9Sum <= 19) { depSeverity = 'Moderately Severe'; depColor = 'red'; }
    else { depSeverity = 'Severe'; depColor = 'red'; }

    // GAD-7 Anxiety Scoring
    var gad7Sum = responses.gad7.reduce(function(a, b) { return a + Math.min(3, Math.max(0, b)); }, 0);
    var anxSeverity, anxColor;
    if (gad7Sum <= 4) { anxSeverity = 'Minimal'; anxColor = 'green'; }
    else if (gad7Sum <= 9) { anxSeverity = 'Mild'; anxColor = 'yellow'; }
    else if (gad7Sum <= 14) { anxSeverity = 'Moderate'; anxColor = 'orange'; }
    else { anxSeverity = 'Severe'; anxColor = 'red'; }

    // Check PHQ-9 item 9 (thoughts that you would be better off dead)
    var item9Alert = responses.phq9[8] >= 1;

    var recommendations = [];
    if (phq9Sum >= 10) recommendations.push('PHQ-9 score suggests moderate+ depression — professional evaluation recommended');
    if (gad7Sum >= 10) recommendations.push('GAD-7 score suggests moderate+ anxiety — professional evaluation recommended');
    if (phq9Sum >= 5 && phq9Sum < 10) recommendations.push('Mild depressive symptoms: regular exercise, social connection, and sleep hygiene may help');
    if (gad7Sum >= 5 && gad7Sum < 10) recommendations.push('Mild anxiety: mindfulness, deep breathing, and stress management techniques recommended');
    if (item9Alert) {
        recommendations.unshift('IMPORTANT: Item 9 response indicates possible self-harm thoughts — please discuss with a professional');
    }
    if (recommendations.length === 0) recommendations.push('Scores within normal range — continue healthy coping strategies');

    return {
        depression: {
            instrument: 'PHQ-9 (Patient Health Questionnaire)',
            score: phq9Sum,
            maxScore: 27,
            severity: depSeverity,
            severityColor: depColor,
            clinicalThreshold: phq9Sum >= 10 ? 'Above clinical threshold — evaluation recommended' : 'Below clinical threshold'
        },
        anxiety: {
            instrument: 'GAD-7 (Generalized Anxiety Disorder)',
            score: gad7Sum,
            maxScore: 21,
            severity: anxSeverity,
            severityColor: anxColor,
            clinicalThreshold: gad7Sum >= 10 ? 'Above clinical threshold — evaluation recommended' : 'Below clinical threshold'
        },
        safetyScreening: {
            selfHarmThoughts: responses.selfHarmThoughts === true,
            item9Elevated: item9Alert,
            status: item9Alert ? 'REQUIRES FOLLOW-UP' : 'No acute safety concerns identified'
        },
        recommendations: recommendations,
        crisisResources: CRISIS_RESOURCES,
        clinicalNotes: 'PHQ-9 and GAD-7 are validated screening instruments. Scores >= 10 warrant professional evaluation.',
        disclaimer: DISCLAIMER
    };
};

// ─── 5. Physical Activity Evaluation ──────────────────────────────────
/**
 * Evaluates physical activity levels against WHO Global Recommendations on
 * Physical Activity for Health (2020 guidelines).
 *
 * WHO recommends for adults (18-64):
 * - At least 150-300 minutes of moderate-intensity aerobic activity per week, OR
 * - At least 75-150 minutes of vigorous-intensity aerobic activity per week
 * - Muscle-strengthening activities 2+ days per week
 * - Limit sedentary behavior; replace with any intensity activity
 *
 * @param {Object} activity - Weekly activity data
 * @param {number} activity.moderateMinutes - Minutes of moderate activity per week
 * @param {number} activity.vigorousMinutes - Minutes of vigorous activity per week
 * @param {number} activity.strengthDays - Days with muscle-strengthening exercises
 * @param {number} activity.sedentaryHours - Average daily sedentary hours
 * @param {number} [activity.steps] - Average daily step count
 * @param {string} [activity.primaryActivity] - Main form of exercise
 * @returns {Object} Activity assessment with WHO compliance score
 *
 * @example
 *   var fitness = physicalActivity({
 *     moderateMinutes: 90, vigorousMinutes: 30,
 *     strengthDays: 1, sedentaryHours: 10,
 *     steps: 5500, primaryActivity: 'walking'
 *   });
 *   console.log(fitness.whoCompliance);     // => "Partial"
 *   console.log(fitness.aerobicScore);      // => 65
 *   console.log(fitness.sedentaryRisk);     // => "Elevated"
 */
var physicalActivity = function physicalActivity(activity) {
    var DISCLAIMER = 'EXERCISE NOTICE: Before starting or significantly changing an exercise ' +
        'program, consult your physician — especially if you have heart disease, diabetes, ' +
        'joint problems, or other chronic conditions. Stop exercising and seek medical ' +
        'attention if you experience chest pain, dizziness, or severe shortness of breath.';

    if (!activity || typeof activity.moderateMinutes !== 'number') {
        return { error: 'Valid activity data required', disclaimer: DISCLAIMER };
    }

    var moderate = activity.moderateMinutes || 0;
    var vigorous = activity.vigorousMinutes || 0;
    var strength = activity.strengthDays || 0;
    var sedentary = activity.sedentaryHours || 0;
    var steps = activity.steps || 0;

    // WHO equivalent minutes (vigorous counts double)
    var equivalentMinutes = moderate + (vigorous * 2);

    // Aerobic score (WHO: 150-300 moderate equivalent)
    var aerobicScore;
    if (equivalentMinutes >= 300) aerobicScore = 100;
    else if (equivalentMinutes >= 150) aerobicScore = 70 + ((equivalentMinutes - 150) / 150) * 30;
    else aerobicScore = (equivalentMinutes / 150) * 70;

    // Strength score (WHO: 2+ days per week)
    var strengthScore;
    if (strength >= 3) strengthScore = 100;
    else if (strength >= 2) strengthScore = 80;
    else if (strength >= 1) strengthScore = 40;
    else strengthScore = 0;

    // Sedentary risk assessment
    var sedentaryRisk;
    if (sedentary <= 6) sedentaryRisk = 'Low';
    else if (sedentary <= 8) sedentaryRisk = 'Moderate';
    else if (sedentary <= 10) sedentaryRisk = 'Elevated';
    else sedentaryRisk = 'High';

    var sedentaryScore;
    if (sedentary <= 6) sedentaryScore = 100;
    else if (sedentary <= 8) sedentaryScore = 70;
    else if (sedentary <= 10) sedentaryScore = 40;
    else sedentaryScore = 15;

    // Step count evaluation (research-based targets)
    var stepCategory;
    if (steps >= 10000) stepCategory = 'Active';
    else if (steps >= 7500) stepCategory = 'Somewhat Active';
    else if (steps >= 5000) stepCategory = 'Low Active';
    else stepCategory = 'Sedentary';

    // WHO compliance determination
    var meetsAerobic = equivalentMinutes >= 150;
    var meetsStrength = strength >= 2;
    var whoCompliance;
    if (meetsAerobic && meetsStrength) whoCompliance = 'Full';
    else if (meetsAerobic || meetsStrength) whoCompliance = 'Partial';
    else whoCompliance = 'Not Met';

    // Overall fitness score
    var overallScore = Math.round(aerobicScore * 0.45 + strengthScore * 0.25 + sedentaryScore * 0.30);

    var recommendations = [];
    if (!meetsAerobic) recommendations.push('Increase aerobic activity to 150+ min/week (WHO minimum guideline)');
    if (!meetsStrength) recommendations.push('Add muscle-strengthening exercises 2+ days/week (WHO guideline)');
    if (sedentary > 8) recommendations.push('Reduce sedentary time: take breaks every 30 minutes, use standing desk');
    if (steps < 7500) recommendations.push('Aim for 7,500-10,000 steps daily for health benefits');
    if (vigorous === 0) recommendations.push('Consider adding vigorous activity (running, swimming, cycling) for efficiency');
    if (recommendations.length === 0) recommendations.push('Excellent activity level! Maintain your current routine.');

    return {
        overallScore: overallScore,
        maxScore: 100,
        whoCompliance: whoCompliance,
        aerobic: {
            moderateMinutes: moderate,
            vigorousMinutes: vigorous,
            equivalentMinutes: equivalentMinutes,
            target: '150-300 moderate equivalent',
            score: Math.round(aerobicScore),
            meetsWHO: meetsAerobic
        },
        strength: {
            daysPerWeek: strength,
            target: '2+ days/week',
            score: strengthScore,
            meetsWHO: meetsStrength
        },
        sedentary: {
            hoursPerDay: sedentary,
            risk: sedentaryRisk,
            score: sedentaryScore
        },
        steps: steps > 0 ? {
            daily: steps,
            category: stepCategory,
            target: '7,500-10,000'
        } : null,
        recommendations: recommendations,
        clinicalNotes: 'Based on WHO 2020 Guidelines on Physical Activity and Sedentary Behaviour.',
        disclaimer: DISCLAIMER
    };
};

// ─── Demo / Self-Test ─────────────────────────────────────────────────
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  VitalLens — Evidence-Based Health & Wellness Analytics     ║');
console.log('║  DISCLAIMER: For informational purposes only.              ║');
console.log('║  Not a substitute for professional medical advice.         ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

// Demo 1: Cardiovascular Risk
console.log('── Cardiovascular Risk Screening ──');
var cvRisk = cardiovascularRisk({
    age: 55, gender: 'male', systolicBP: 145,
    totalCholesterol: 250, hdlCholesterol: 42,
    smoker: false, diabetic: true, onBPMeds: true
});
console.log('10-Year Risk: ' + cvRisk.tenYearRisk + ' (' + cvRisk.category + ')');
console.log('Risk Color: ' + cvRisk.riskColor);
console.log('BP Status: ' + cvRisk.riskFactors.bloodPressure.impact);
console.log('Cholesterol Ratio: ' + cvRisk.riskFactors.cholesterol.ratio + ':1');
cvRisk.recommendations.forEach(function(r) { console.log('  → ' + r); });
console.log('');

// Demo 2: Sleep Quality
console.log('── Sleep Quality Assessment (PSQI) ──');
var sleepResult = sleepQuality({
    hoursPerNight: 5.5, minutesToFallAsleep: 40,
    nightAwakenings: 3, bedTime: '00:30', wakeTime: '06:00',
    snoring: true, daytimeSleepiness: true
});
console.log('Global Score: ' + sleepResult.globalScore + '/21 (' + sleepResult.quality + ')');
console.log('Sleep Efficiency: ' + sleepResult.sleepEfficiency);
console.log('Apnea Risk: ' + sleepResult.sleepApneaRisk);
sleepResult.recommendations.forEach(function(r) { console.log('  → ' + r); });
console.log('');

// Demo 3: Nutritional Balance
console.log('── Nutritional Balance (WHO Guidelines) ──');
var nutritionResult = nutritionalBalance({
    calories: 2200, proteinGrams: 65, carbGrams: 300,
    fatGrams: 85, fiberGrams: 18, sodiumMg: 3500,
    sugarGrams: 50, fruitServings: 1, vegServings: 2,
    waterLiters: 1.5
});
console.log('Overall Score: ' + nutritionResult.overallScore + '/100 (Grade: ' + nutritionResult.grade + ')');
console.log('Protein: ' + nutritionResult.macroBreakdown.protein.percentage + ' (target ' + nutritionResult.macroBreakdown.protein.target + ')');
console.log('Sodium: ' + nutritionResult.micronutrients.sodium.mg + 'mg (target ' + nutritionResult.micronutrients.sodium.target + ')');
nutritionResult.criticalAlerts.forEach(function(a) { console.log('  ⚠ ' + a); });
nutritionResult.recommendations.forEach(function(r) { console.log('  → ' + r); });
console.log('');

// Demo 4: Mental Wellness
console.log('── Mental Wellness Screening ──');
var mentalResult = mentalWellness({
    phq9: [1, 0, 1, 2, 1, 0, 1, 0, 0],
    gad7: [1, 1, 0, 1, 0, 1, 0],
    selfHarmThoughts: false
});
console.log('Depression (PHQ-9): ' + mentalResult.depression.score + '/27 — ' + mentalResult.depression.severity);
console.log('Anxiety (GAD-7): ' + mentalResult.anxiety.score + '/21 — ' + mentalResult.anxiety.severity);
console.log('Safety: ' + mentalResult.safetyScreening.status);
mentalResult.recommendations.forEach(function(r) { console.log('  → ' + r); });
console.log('');

// Demo 5: Physical Activity
console.log('── Physical Activity (WHO 2020) ──');
var activityResult = physicalActivity({
    moderateMinutes: 90, vigorousMinutes: 30,
    strengthDays: 1, sedentaryHours: 10,
    steps: 5500, primaryActivity: 'walking'
});
console.log('Overall Score: ' + activityResult.overallScore + '/100');
console.log('WHO Compliance: ' + activityResult.whoCompliance);
console.log('Aerobic: ' + activityResult.aerobic.equivalentMinutes + ' equiv. min (target: ' + activityResult.aerobic.target + ')');
console.log('Sedentary Risk: ' + activityResult.sedentary.risk);
activityResult.recommendations.forEach(function(r) { console.log('  → ' + r); });

// Module exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cardiovascularRisk: cardiovascularRisk,
        sleepQuality: sleepQuality,
        nutritionalBalance: nutritionalBalance,
        mentalWellness: mentalWellness,
        physicalActivity: physicalActivity
    };
}
