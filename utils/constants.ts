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

// ─── QA Module ────────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  USER_ID:      'ayurveda_user_id',
  USER_PROFILE: 'ayurveda_user_profile',
  SESSIONS:     'ayurveda_sessions',
  CHAT_HISTORY: 'ayurveda_chat_history',
  BOOKMARKS:    'ayurveda_bookmarks',
};

export function generateFollowUps(question: string): string[] {
  const q = question.toLowerCase();
  const herbPatterns: Array<[RegExp, string[]]> = [
    [/turmeric|kaha|manjal|haldi/, ['What are the side effects of Turmeric?', 'What is the correct dosage of Turmeric?', 'Can Turmeric be combined with black pepper?']],
    [/cinnamon|kurudu/, ['What are the side effects of Cinnamon?', 'How much Cinnamon should I take daily?', 'Is Cinnamon good for blood sugar?']],
    [/ginger|inguru/, ['What are the side effects of Ginger?', 'Is Ginger good for digestion?', 'Can I take Ginger with Turmeric?']],
    [/neem|kohomba/, ['How is Neem used for skin?', 'What is the dosage of Neem?', 'What are Neem side effects?']],
    [/aloe.?vera|welpenela/, ['How much Aloe Vera is safe to drink?', 'Is Aloe Vera good for digestion?', 'What are the skin benefits of Aloe Vera?']],
    [/ashwagandha/, ['How does Ashwagandha help stress?', 'What is the dosage of Ashwagandha?', 'Can I take Ashwagandha daily?']],
    [/nelli|gooseberry|amla/, ['What vitamins are in Gooseberry?', 'How does Nelli help immunity?', 'Can I eat Nelli daily?']],
    [/coriander|kottamalli/, ['How is Coriander used in Ayurveda?', 'What are the digestive benefits of Coriander?', 'Can Coriander seeds treat UTI?']],
  ];
  for (const [pattern, questions] of herbPatterns) {
    if (pattern.test(q)) return questions;
  }
  if (/benefit|guna|use|property/.test(q))  return ['Are there any side effects?', 'What is the recommended dosage?', 'Which dosha benefits most?'];
  if (/side.?effect|harm|safe/.test(q))      return ['What is a safe dosage?', 'What are the benefits?', 'Can children use this?'];
  if (/dosage|dose|how much/.test(q))        return ['What are the benefits?', 'Are there side effects?', 'How long should I take it?'];
  if (/vata|pitta|kapha|dosha/.test(q))      return ['What foods balance this dosha?', 'Which herbs help this dosha?', 'What activities help balance?'];
  return ['Tell me more about this topic', 'What are the Ayurvedic tips for this?', 'Which dosha is affected?'];
}

export const QA_PRAKRITI_QUESTIONS = [
  { id: 'q1',  question: 'What is your body frame and build?',        options: { A: 'Thin, light frame, hard to gain weight', B: 'Medium build, muscular, athletic',         C: 'Heavy, sturdy frame, easy to gain weight' } },
  { id: 'q2',  question: 'How is your digestion typically?',          options: { A: 'Irregular, often gas or bloating',          B: 'Strong, feel hungry often',                C: 'Slow but steady, can skip meals' } },
  { id: 'q3',  question: 'What is your skin type?',                   options: { A: 'Dry, rough, thin',                         B: 'Warm, oily, prone to rashes',              C: 'Thick, moist, smooth' } },
  { id: 'q4',  question: 'How do you handle stress?',                 options: { A: 'Anxious, worried',                         B: 'Irritable, angry',                         C: 'Calm, withdrawn' } },
  { id: 'q5',  question: 'What is your sleep pattern?',               options: { A: 'Light sleeper, difficulty sleeping',        B: 'Moderate, wake refreshed',                 C: 'Heavy sleeper, need lots of sleep' } },
  { id: 'q6',  question: 'How is your energy level?',                 options: { A: 'Bursts, get tired easily',                 B: 'Consistent and strong',                    C: 'Steady, slow to start' } },
  { id: 'q7',  question: 'What is your temperature preference?',      options: { A: 'Prefer warm, dislike cold',                B: 'Prefer cool, dislike heat',                C: 'Comfortable in most weather' } },
  { id: 'q8',  question: 'How do you learn and remember?',            options: { A: 'Learn quickly, forget quickly',            B: 'Sharp intellect, good memory',             C: 'Learn slowly but retain well' } },
  { id: 'q9',  question: 'What is your speaking style?',              options: { A: 'Fast, talkative',                         B: 'Precise, articulate',                      C: 'Slow, melodious' } },
  { id: 'q10', question: 'How do you approach new activities?',       options: { A: 'Enthusiastic but may not finish',          B: 'Focused, competitive',                     C: 'Resistant to change, prefer routine' } },
];