export const SYMPTOMS = [
  'Irregular burning sensation','Bloating with gas','Abdominal pain','Constipation',
  'Intense burning sensation','Sour belching','Acid regurgitation','Nausea',
  'Heavy feeling in stomach','Sweet taste in mouth','Loss of appetite','Excessive salivation',
  'Severe joint pain','Joint stiffness in morning','Crackling sound in joints','Difficulty in movement',
  'Burning sensation in joints','Redness around joints','Fever with joint pain','Inflammation',
  'Joint swelling','Heaviness in joints','Coldness in affected area','Reduced flexibility',
  'Excessive urination','Dry mouth','Weight loss','Fatigue','Excessive thirst',
  'Burning sensation while urinating','Yellowish urine','Excessive hunger','Turbid urine',
  'Excessive sleep','Heaviness in body','Throbbing headache','One-sided head pain',
  'Sensitivity to light','Dizziness','Burning sensation in head','Redness in eyes',
  'Nausea with headache','Visual disturbances','Heaviness in head','Dull aching pain',
  'Excessive sleep with headache','Nasal congestion','Dry cough','Difficulty breathing',
  'Chest tightness','Wheezing sound','Burning sensation in chest','Fever with breathing difficulty',
  'Yellowish sputum','Excessive thirst with breathlessness','Productive cough',
  'White thick sputum','Heaviness in chest','Relief after expectoration',
];

export const PRAKRITI_QUESTIONS = [
  {
    id: 'body_build',
    question: 'How would you describe your body build?',
    options: [
      { label: 'Thin, light frame', value: 'vata', dosha: 'Vata' },
      { label: 'Medium, muscular', value: 'pitta', dosha: 'Pitta' },
      { label: 'Heavy, large frame', value: 'kapha', dosha: 'Kapha' },
    ],
  },
  {
    id: 'skin_type',
    question: 'What best describes your skin type?',
    options: [
      { label: 'Dry, rough, cool', value: 'vata', dosha: 'Vata' },
      { label: 'Warm, oily, sensitive', value: 'pitta', dosha: 'Pitta' },
      { label: 'Thick, oily, cool', value: 'kapha', dosha: 'Kapha' },
    ],
  },
  {
    id: 'appetite',
    question: 'How would you describe your appetite?',
    options: [
      { label: 'Irregular, variable', value: 'vata', dosha: 'Vata' },
      { label: 'Strong, sharp', value: 'pitta', dosha: 'Pitta' },
      { label: 'Steady, low', value: 'kapha', dosha: 'Kapha' },
    ],
  },
  {
    id: 'sleep',
    question: 'What is your sleep pattern like?',
    options: [
      { label: 'Light, interrupted', value: 'vata', dosha: 'Vata' },
      { label: 'Moderate, sound', value: 'pitta', dosha: 'Pitta' },
      { label: 'Deep, prolonged', value: 'kapha', dosha: 'Kapha' },
    ],
  },
  {
    id: 'mental_activity',
    question: 'How is your mental activity?',
    options: [
      { label: 'Quick, restless', value: 'vata', dosha: 'Vata' },
      { label: 'Sharp, focused', value: 'pitta', dosha: 'Pitta' },
      { label: 'Calm, steady', value: 'kapha', dosha: 'Kapha' },
    ],
  },
  {
    id: 'temperament',
    question: 'What describes your temperament?',
    options: [
      { label: 'Anxious, worried', value: 'vata', dosha: 'Vata' },
      { label: 'Angry, irritable', value: 'pitta', dosha: 'Pitta' },
      { label: 'Calm, attached', value: 'kapha', dosha: 'Kapha' },
    ],
  },
];

export const DISEASE_INFO: any = {
  Gastritis: {
    sanskrit: 'Amlapitta',
    description: 'A digestive disorder characterized by burning sensation and acidity.',
    dosha: 'Primarily Pitta imbalance',
    symptoms: 'Burning sensation, sour belching, nausea, loss of appetite',
    lifestyle: ['Avoid spicy and acidic foods','Eat at regular intervals','Practice stress management','Get adequate sleep'],
    diet: ['Cool, soothing foods','Fresh fruits (sweet)','Coconut water','Avoid caffeine and alcohol'],
  },
  Arthritis: {
    sanskrit: 'Amavata',
    description: 'Joint inflammation causing pain, stiffness, and swelling.',
    dosha: 'Vata-Kapha imbalance',
    symptoms: 'Joint pain, morning stiffness, swelling, reduced mobility',
    lifestyle: ['Regular gentle exercise','Warm oil massage','Avoid cold, damp environments','Maintain healthy weight'],
    diet: ['Warm, cooked foods','Anti-inflammatory spices','Avoid cold drinks','Include ginger and turmeric'],
  },
  Diabetes: {
    sanskrit: 'Prameha',
    description: 'A metabolic disorder affecting blood sugar levels.',
    dosha: 'Primarily Kapha imbalance',
    symptoms: 'Excessive thirst, frequent urination, fatigue, weight changes',
    lifestyle: ['Regular physical activity','Weight management','Stress reduction','Adequate sleep'],
    diet: ['Low glycemic index foods','Bitter vegetables','Whole grains','Avoid refined sugars'],
  },
  Migraine: {
    sanskrit: 'Ardhavabhedaka',
    description: 'Severe one-sided headache with associated symptoms.',
    dosha: 'Primarily Vata-Pitta imbalance',
    symptoms: 'Throbbing headache, sensitivity to light, nausea, visual disturbances',
    lifestyle: ['Regular sleep schedule','Avoid triggers','Practice relaxation techniques','Stay hydrated'],
    diet: ['Regular meal times','Avoid fermented foods','Fresh, light foods','Avoid chocolate and cheese'],
  },
  Asthma: {
    sanskrit: 'Shwasa',
    description: 'Respiratory condition causing breathing difficulty.',
    dosha: 'Primarily Kapha-Vata imbalance',
    symptoms: 'Wheezing, shortness of breath, chest tightness, coughing',
    lifestyle: ['Avoid allergens','Practice breathing exercises','Keep environment clean','Avoid cold exposure'],
    diet: ['Warm, light foods','Avoid dairy products','Ginger and honey','Avoid cold beverages'],
  },
};

export const TEAM_MEMBERS = [
  { name: 'Perera S I A', id: 'IT22905918', component: 'Disease Prediction' },
  { name: 'Roche J P', id: 'IT22344274', component: 'Medicine Recommendation' },
  { name: 'Dias W A N M', id: 'IT22899910', component: 'Diet Planning' },
  { name: 'Fernando K P M R A', id: 'IT22897176', component: 'Q&A System' },
];

export const DISEASE_OPTIONS = [
  { label: "Select your condition", value: "" },
  { label: "Arthritis", value: "arthritis" },
  { label: "Gastritis", value: "gastritis" },
  { label: "Asthma", value: "asthma" },
  { label: "Migraine", value: "migraine" },
  { label: "Diabetes", value: "diabetes" },
];

export const REGION_OPTIONS = [
  { label: "Select your region", value: "" },
  { label: "Western Region", value: "Western" },
  { label: "Eastern", value: "North_Central_Eastern" },
  { label: "Eastern Region", value: "Eastern" },
  { label: "Southern Region", value: "Southern " },
  { label: "Central Region", value: "Central" },
];

export const GENDER_OPTIONS = [
  { label: "Select gender", value: "" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

export const AGNI_OPTIONS = [
  { label: "Select Agni State", value: "" },
  { label: "Vishama", value: "Vishama Agni" },
  { label: "Sama", value: "Sama Agni" },
  { label: "Manda", value: "Manda Agni" },
  { label: "Tikshna", value: "Tikshna Agni" },
];