export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  country: "RO" | "DE" | "BOTH" | "INT";
  isPublic: boolean;
  type: "religious" | "national" | "cultural";
  description?: string;
}

/**
 * Calculates Gregorian Easter (Catholic/Protestant/German)
 */
export function getGregorianEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Calculates Orthodox Easter (Romanian)
 */
export function getOrthodoxEaster(year: number): Date {
  const a = year % 19;
  const b = year % 4;
  const c = year % 7;
  const d = (19 * a + 15) % 30;
  const e = (2 * b + 4 * c + 6 * d + 6) % 7;
  const f = d + e;

  // Julian date
  let month, day;
  if (f <= 9) {
    month = 3; // March
    day = 22 + f;
  } else {
    month = 4; // April
    day = f - 9;
  }

  // Convert Julian to Gregorian (valid for 1900-2099)
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 13);
  return date;
}

export function getHolidays(year: number, country?: string): Holiday[] {
  const holidays: Holiday[] = [];

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const addHoliday = (
    date: string,
    name: string,
    countryCode: "RO" | "DE" | "BOTH" | "INT",
    isPublic: boolean,
    type: "religious" | "national" | "cultural",
    description?: string,
  ) => {
    if (
      !country ||
      country === "ALL" ||
      countryCode === "BOTH" ||
      countryCode === "INT" ||
      countryCode === country
    ) {
      holidays.push({
        date,
        name,
        country: countryCode,
        isPublic,
        type,
        description,
      });
    }
  };

  // --- ROMANIA FIXED ---
  addHoliday(
    `${year}-01-01`,
    "Anul Nou",
    "BOTH",
    true,
    "national",
    "Prima zi a anului calendaristic. În România și Germania este zi nelucrătoare.",
  );
  addHoliday(
    `${year}-01-02`,
    "Anul Nou",
    "RO",
    true,
    "national",
    "A doua zi de Anul Nou, zi nelucrătoare în România.",
  );
  addHoliday(
    `${year}-01-06`,
    "Boboteaza",
    "RO",
    true,
    "religious",
    "Sărbătoarea Botezului Domnului în apele Iordanului de către Sfântul Ioan Botezătorul.",
  );
  addHoliday(
    `${year}-01-07`,
    "Sfântul Ioan Botezătorul",
    "RO",
    true,
    "religious",
    "Soborul Sfântului Proroc Ioan Botezătorul, cel care L-a botezat pe Iisus Hristos.",
  );
  addHoliday(
    `${year}-01-24`,
    "Unirea Principatelor Române",
    "RO",
    true,
    "national",
    "Ziua Unirii Principatelor Române (Mica Unire) sub conducerea lui Alexandru Ioan Cuza în 1859.",
  );

  addHoliday(
    `${year}-02-14`,
    "Valentine's Day",
    "INT",
    false,
    "cultural",
    "Ziua Îndrăgostiților, o sărbătoare a iubirii și afecțiunii între parteneri.",
  );
  addHoliday(
    `${year}-02-24`,
    "Dragobete",
    "RO",
    false,
    "cultural",
    "Sărbătoarea tradițională românească a iubirii, considerată ziua când păsările se logodesc.",
  );

  addHoliday(
    `${year}-03-01`,
    "Mărțișor",
    "RO",
    false,
    "cultural",
    "Sărbătoarea primăverii. Se oferă mărțișoare ca simbol al norocului și al renașterii naturii.",
  );
  addHoliday(
    `${year}-03-08`,
    "Ziua Internațională a Femeii",
    "INT",
    false,
    "cultural",
    "Ziua în care se celebrează realizările sociale, economice și politice ale femeilor. În România este asociată și cu Ziua Mamei.",
  );

  addHoliday(
    `${year}-04-23`,
    "Sfântul Gheorghe",
    "RO",
    false,
    "religious",
    "Sfântul Mare Mucenic Gheorghe, purtătorul de biruință, ocrotitorul armatei române.",
  );

  addHoliday(
    `${year}-05-01`,
    "Ziua Muncii / Tag der Arbeit",
    "BOTH",
    true,
    "national",
    "Ziua Internațională a Muncitorilor, celebrată prin evenimente sociale și politice.",
  );
  addHoliday(
    `${year}-05-10`,
    "Ziua Independenței Naționale",
    "RO",
    false,
    "national",
    "Ziua în care România și-a proclamat independența față de Imperiul Otoman în 1877.",
  );

  // Ziua Mamei (1st Sunday of May in RO)
  const firstMay = new Date(year, 4, 1);
  const firstSundayMay = new Date(year, 4, 1 + ((7 - firstMay.getDay()) % 7));
  addHoliday(
    formatDate(firstSundayMay),
    "Ziua Mamei",
    "RO",
    false,
    "cultural",
    "Zi dedicată celebrării mamelor și maternității în România.",
  );

  addHoliday(
    `${year}-05-21`,
    "Sfinții Constantin și Elena",
    "RO",
    false,
    "religious",
    "Sărbătoarea Sfinților Împărați Constantin și mama sa, Elena, protectorii credinței creștine.",
  );

  addHoliday(
    `${year}-06-01`,
    "Ziua Copilului",
    "RO",
    true,
    "national",
    "Ziua Internațională a Copilului, dedicată protecției și celebrării celor mici.",
  );
  addHoliday(
    `${year}-06-26`,
    "Ziua Tricolorului",
    "RO",
    false,
    "national",
    "Ziua dedicată drapelului național al României.",
  );

  addHoliday(
    `${year}-07-29`,
    "Ziua Imnului Național",
    "RO",
    false,
    "national",
    'Ziua în care se celebrează imnul "Deșteaptă-te, române!", simbol al unității naționale.',
  );

  addHoliday(
    `${year}-08-15`,
    "Adormirea Maicii Domnului",
    "RO",
    true,
    "religious",
    "Sărbătoarea ridicării la cer a Fecioarei Maria. Zi de pelerinaj și rugăciune.",
  );

  addHoliday(
    `${year}-10-31`,
    "Halloween",
    "INT",
    false,
    "cultural",
    "Sărbătoare de origine celtică, marcată prin costume, decorațiuni și tradiții specifice.",
  );

  addHoliday(
    `${year}-11-30`,
    "Sfântul Andrei",
    "RO",
    true,
    "religious",
    "Sfântul Apostol Andrei, cel întâi chemat, ocrotitorul României.",
  );

  addHoliday(
    `${year}-12-01`,
    "Ziua Națională a României",
    "RO",
    true,
    "national",
    "Ziua Marii Uniri de la Alba Iulia din 1918, momentul formării României Mari.",
  );
  addHoliday(
    `${year}-12-08`,
    "Ziua Constituției",
    "RO",
    false,
    "national",
    "Ziua adoptării Constituției României prin referendum în 1991.",
  );
  addHoliday(
    `${year}-12-25`,
    "Crăciun / Weihnachtstag",
    "BOTH",
    true,
    "religious",
    "Sărbătoarea Nașterii Domnului Iisus Hristos.",
  );
  addHoliday(
    `${year}-12-26`,
    "Crăciun / Weihnachtstag",
    "BOTH",
    true,
    "religious",
    "A doua zi de Crăciun, dedicată familiei și tradițiilor creștine.",
  );

  // --- GERMANY FIXED ---
  addHoliday(
    `${year}-10-03`,
    "Tag der Deutschen Einheit",
    "DE",
    true,
    "national",
    "Ziua Unității Germane, celebrând reunificarea Germaniei în 1990.",
  );

  // --- VARIABLE HOLIDAYS (ORTHODOX - RO) ---
  const orthodoxEaster = getOrthodoxEaster(year);

  const goodFridayRO = new Date(orthodoxEaster);
  goodFridayRO.setDate(goodFridayRO.getDate() - 2);
  addHoliday(
    formatDate(goodFridayRO),
    "Vinerea Mare (Ortodoxă)",
    "RO",
    true,
    "religious",
    "Ziua răstignirii și morții lui Iisus Hristos, zi de post negru și reculegere.",
  );

  addHoliday(
    formatDate(orthodoxEaster),
    "Paștele Ortodox",
    "RO",
    true,
    "religious",
    "Cea mai mare sărbătoare creștină, celebrând Învierea Domnului.",
  );

  const easterMondayRO = new Date(orthodoxEaster);
  easterMondayRO.setDate(easterMondayRO.getDate() + 1);
  addHoliday(
    formatDate(easterMondayRO),
    "A doua zi de Paște (Ortodoxă)",
    "RO",
    true,
    "religious",
    "Continuarea celebrării Învierii Domnului.",
  );

  // Ziua Eroilor (Ascension Day - 40 days after Easter)
  const heroesDay = new Date(orthodoxEaster);
  heroesDay.setDate(heroesDay.getDate() + 39);
  addHoliday(
    formatDate(heroesDay),
    "Ziua Eroilor (Înălțarea Domnului)",
    "RO",
    false,
    "national",
    "Zi de pomenire a eroilor neamului românesc, celebrată odată cu Înălțarea Domnului.",
  );

  const pentecostRO = new Date(orthodoxEaster);
  pentecostRO.setDate(pentecostRO.getDate() + 49);
  addHoliday(
    formatDate(pentecostRO),
    "Rusalii",
    "RO",
    true,
    "religious",
    "Pogorârea Sfântului Duh asupra apostolilor, considerată ziua întemeierii Bisericii.",
  );

  const pentecostMondayRO = new Date(orthodoxEaster);
  pentecostMondayRO.setDate(pentecostMondayRO.getDate() + 50);
  addHoliday(
    formatDate(pentecostMondayRO),
    "A doua zi de Rusalii",
    "RO",
    true,
    "religious",
    "Sărbătoare religioasă și zi nelucrătoare.",
  );

  // --- VARIABLE HOLIDAYS (GREGORIAN - DE) ---
  const gregorianEaster = getGregorianEaster(year);

  const goodFridayDE = new Date(gregorianEaster);
  goodFridayDE.setDate(goodFridayDE.getDate() - 2);
  addHoliday(
    formatDate(goodFridayDE),
    "Karfreitag",
    "DE",
    true,
    "religious",
    "Vinerea Mare în Germania, zi de reculegere.",
  );

  const easterMondayDE = new Date(gregorianEaster);
  easterMondayDE.setDate(easterMondayDE.getDate() + 1);
  addHoliday(
    formatDate(easterMondayDE),
    "Ostermontag",
    "DE",
    true,
    "religious",
    "Lunea Paștelui în Germania.",
  );

  const ascensionDE = new Date(gregorianEaster);
  ascensionDE.setDate(ascensionDE.getDate() + 39);
  addHoliday(
    formatDate(ascensionDE),
    "Christi Himmelfahrt",
    "DE",
    true,
    "religious",
    "Înălțarea Domnului în Germania.",
  );

  const whitMondayDE = new Date(gregorianEaster);
  whitMondayDE.setDate(whitMondayDE.getDate() + 50);
  addHoliday(
    formatDate(whitMondayDE),
    "Pfingstmontag",
    "DE",
    true,
    "religious",
    "Lunea Rusaliilor în Germania.",
  );

  return holidays;
}
