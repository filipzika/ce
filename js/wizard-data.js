/* Datový model průvodce: otázky, větvení a pravidla pro sestavení výsledného přehledu.
   Žádná DOM logika zde není — jen čistá data a malé pomocné funkce (next). */

(function () {
  'use strict';

  var QUESTIONS = {

    category: {
      id: 'category',
      slot: 1,
      title: 'V jakém prostředí bude zařízení používáno?',
      help: 'Vyberte hlavní zamýšlené použití výrobku — určuje, zda se uplatní i sektorová legislativa nad rámec obecných požadavků na elektrozařízení.',
      type: 'single',
      options: [
        { value: 'household', label: 'Domácnost / kancelář', desc: 'Spotřební elektronika, kancelářská technika' },
        { value: 'industrial', label: 'Průmysl / profesionální nasazení', desc: 'Zařízení mimo přímý prodej spotřebitelům' },
        { value: 'medical', label: 'Zdravotnictví', desc: 'Zdravotnický prostředek nebo jeho příslušenství' },
        { value: 'automotive', label: 'Automobilový / dopravní průmysl', desc: 'Součást vozidla nebo dopravní infrastruktury' },
        { value: 'toy', label: 'Hračka', desc: 'Výrobek určený dětem do 14 let ke hře' }
      ],
      next: function (a) {
        if (a.category === 'medical') return 'medical_class';
        if (a.category === 'automotive') return 'automotive_role';
        if (a.category === 'toy') return 'toy_age';
        return 'power_type';
      }
    },

    medical_class: {
      id: 'medical_class',
      slot: 1,
      title: 'Jaká je riziková třída zdravotnického prostředku dle MDR?',
      help: 'Orientační zařazení dle Nařízení (EU) 2017/745 — určuje míru zapojení notifikované osoby.',
      type: 'single',
      options: [
        { value: 'I', label: 'Třída I', desc: 'Nízké riziko' },
        { value: 'IIa', label: 'Třída IIa', desc: 'Střední riziko' },
        { value: 'IIb_III', label: 'Třída IIb / III', desc: 'Vyšší / vysoké riziko' },
        { value: 'unsure', label: 'Nevím', desc: 'Potřebuji klasifikovat dle Přílohy VIII MDR' }
      ],
      next: function () { return 'medical_software'; }
    },

    medical_software: {
      id: 'medical_software',
      slot: 1,
      title: 'Je zařízení nebo jeho řídicí software samostatně kvalifikován jako zdravotnický prostředek (MDSW)?',
      type: 'single',
      options: [
        { value: 'yes', label: 'Ano', desc: 'Software je sám o sobě zdravotnický prostředek' },
        { value: 'no', label: 'Ne', desc: 'Software pouze podporuje funkci hardwaru' }
      ],
      next: function () { return 'power_type'; }
    },

    automotive_role: {
      id: 'automotive_role',
      slot: 1,
      title: 'Jakou roli zařízení ve vozidle plní?',
      type: 'single',
      options: [
        { value: 'component_typeapproval', label: 'Komponenta s vlastním typovým schválením', desc: 'Např. světlomet, řídicí jednotka emisí' },
        { value: 'aftermarket_accessory', label: 'Obecné elektronické příslušenství', desc: 'Např. USB nabíječka, palubní kamera — neschvalováno samostatně' }
      ],
      next: function () { return 'power_type'; }
    },

    toy_age: {
      id: 'toy_age',
      slot: 1,
      title: 'Pro jakou věkovou kategorii je hračka určena?',
      type: 'single',
      options: [
        { value: 'under36m', label: 'Do 36 měsíců', desc: 'Přísnější požadavky na malé části' },
        { value: 'over36m', label: 'Nad 36 měsíců', desc: '' }
      ],
      next: function () { return 'toy_risk'; }
    },

    toy_risk: {
      id: 'toy_risk',
      slot: 1,
      title: 'Obsahuje hračka elektrické/elektronické části s rizikem?',
      help: 'Např. baterie přístupné dítěti, zahřívající se části, hlasitý zvuk.',
      type: 'single',
      options: [
        { value: 'yes', label: 'Ano', desc: '' },
        { value: 'no', label: 'Ne', desc: '' }
      ],
      next: function () { return 'power_type'; }
    },

    power_type: {
      id: 'power_type',
      slot: 2,
      title: 'Jak je zařízení napájeno?',
      type: 'single',
      options: [
        { value: 'ac', label: 'Přímo ze sítě (AC)', desc: 'Střídavé napětí' },
        { value: 'dc', label: 'Stejnosměrně (DC)', desc: 'Adaptér, baterie, PoE…' }
      ],
      next: function (a) { return a.power_type === 'ac' ? 'voltage_ac' : 'voltage_dc'; }
    },

    voltage_ac: {
      id: 'voltage_ac',
      slot: 3,
      title: 'Jaké je napájecí napětí (AC)?',
      type: 'single',
      options: [
        { value: 'low', label: '≤ 50 V AC', desc: 'Pod prahem LVD' },
        { value: 'mid', label: '50–1000 V AC', desc: 'Typický rozsah spotřební/ICT elektroniky' },
        { value: 'high', label: '> 1000 V AC', desc: 'Nad typickým rozsahem' }
      ],
      next: function () { return 'wireless'; }
    },

    voltage_dc: {
      id: 'voltage_dc',
      slot: 3,
      title: 'Jaké je napájecí napětí (DC)?',
      type: 'single',
      options: [
        { value: 'low', label: '≤ 75 V DC', desc: 'Pod prahem LVD' },
        { value: 'mid', label: '75–1500 V DC', desc: 'Typický rozsah spotřební/ICT elektroniky' },
        { value: 'high', label: '> 1500 V DC', desc: 'Nad typickým rozsahem' }
      ],
      next: function () { return 'wireless'; }
    },

    wireless: {
      id: 'wireless',
      slot: 4,
      title: 'Obsahuje zařízení bezdrátový / rádiový modul?',
      help: 'Wi-Fi, Bluetooth, GSM/LTE/5G, LoRa, RFID/NFC, nebo jiný vysílač.',
      type: 'single',
      options: [
        { value: 'yes', label: 'Ano', desc: '' },
        { value: 'no', label: 'Ne', desc: '' }
      ],
      next: function (a) { return a.wireless === 'yes' ? 'wireless_tech' : 'battery'; }
    },

    wireless_tech: {
      id: 'wireless_tech',
      slot: 5,
      title: 'Jaké bezdrátové technologie zařízení obsahuje?',
      help: 'Vyberte vše, co platí.',
      type: 'multi',
      options: [
        { value: 'wifi_bt', label: 'Wi-Fi / Bluetooth', desc: '2,4 / 5 GHz' },
        { value: 'cellular', label: 'Mobilní síť', desc: 'GSM / LTE / 5G' },
        { value: 'lora_subghz', label: 'LoRa / sub-GHz IoT', desc: 'Zařízení krátkého dosahu' },
        { value: 'rfid_nfc', label: 'RFID / NFC', desc: '' },
        { value: 'other', label: 'Jiná / neznámá technologie', desc: '' }
      ],
      next: function () { return 'battery'; }
    },

    battery: {
      id: 'battery',
      slot: 6,
      title: 'Obsahuje zařízení baterii nebo akumulátor?',
      help: 'Včetně vyměnitelných článků dodávaných se zařízením.',
      type: 'single',
      options: [
        { value: 'embedded', label: 'Ano, vestavěná / nevyjímatelná', desc: '' },
        { value: 'removable', label: 'Ano, vyměnitelná / vyjímatelná', desc: '' },
        { value: 'none', label: 'Ne', desc: '' }
      ],
      next: function () { return 'food_contact'; }
    },

    food_contact: {
      id: 'food_contact',
      slot: 7,
      title: 'Přichází zařízení do přímého kontaktu s potravinami?',
      help: 'Např. varná deska, nádobka mixéru, tryska kávovaru, deska kuchyňské váhy — nikoli jen okolní vzduch.',
      type: 'single',
      options: [
        { value: 'yes', label: 'Ano', desc: '' },
        { value: 'no', label: 'Ne', desc: '' }
      ],
      next: function () { return null; }
    }
  };

  var TOTAL_SLOTS = 7;

  // ---- Pravidla ----------------------------------------------------------
  // Každý klíč "questionId.hodnota" mapuje na příspěvky do výsledného přehledu.
  // universal = platí vždy; gpsr = aplikuje se podmíněně dle flags.gpsrApplies.

  var RULES = {

    universal: {
      markings: [
        { code: 'CE', label: 'CE (Conformité Européenne)', reason: 'Povinné označení shody pro uvedení výrobku na trh EU' },
        { code: 'WEEE', label: 'Symbol přeškrtnuté popelnice', reason: 'Označení nakládání s elektroodpadem — na výrobku, nebo na obalu/manuálu, je-li výrobek příliš malý' }
      ],
      directives: [
        { code: '2011/65/EU', name: 'RoHS — omezení nebezpečných látek', reason: 'Vztahuje se automaticky na veškerá elektrická a elektronická zařízení', verification: 'test', verificationNote: 'Ověření obsahu nebezpečných látek vyžaduje analytické testování (typicky XRF screening, případně chemický rozbor) — často zajišťuje dodavatel komponent/materiálu.' },
        { code: '2012/19/EU', name: 'WEEE — odpadní elektrická a elektronická zařízení', reason: 'Vztahuje se automaticky na veškerá elektrická a elektronická zařízení', verification: 'doc', verificationNote: 'Jde jen o registraci výrobce a označení výrobku, žádné zkoušení výrobku se nevyžaduje.' },
        { code: 'ES 1907/2006', name: 'REACH — registrace, hodnocení a povolování chemických látek', reason: 'Podmíněná povinnost informování o látkách SVHC dle čl. 33', verification: 'doc', verificationNote: 'Primárně dotaz do dodavatelského řetězce a vyhodnocení složení; laboratorní analýza je nutná jen když složení není od dodavatelů známo.' }
      ],
      standards: [
        { code: 'EN IEC 63000', name: 'EN IEC 63000 — technická dokumentace pro posouzení RoHS', category: 'rohs', verification: 'doc', verificationNote: 'Procesní norma pro sestavení technické dokumentace, sama o sobě nezahrnuje laboratorní zkoušení.' }
      ],
      docs: [
        { code: 'doc-doc', text: 'EU Prohlášení o shodě (DoC) — lze sloučit do jednoho dokumentu napříč všemi aplikovatelnými směrnicemi/nařízeními' },
        { code: 'doc-techfile', text: 'Technická dokumentace (technický spis) prokazující shodu se všemi aplikovatelnými požadavky' },
        { code: 'doc-manual', text: 'Návod k použití a bezpečnostní informace v jazyce cílového členského státu (min. čeština pro ČR)' },
        { code: 'doc-traceability', text: 'Sledovatelnost — typové/dávkové/sériové označení a identifikace výrobce na výrobku' },
        { code: 'doc-rohs', text: 'RoHS prohlášení a materiálová dokumentace (BOM, XRF reporty) — obvykle součástí sloučeného DoC' },
        { code: 'doc-reach', text: 'Prověření látek SVHC (REACH čl. 33); při překročení prahu 0,1 % hm. i oznámení do databáze SCIP (ECHA)', conditional: true },
        { code: 'doc-weee-reg', text: 'Registrace výrobce v systému WEEE v každém členském státě uvedení na trh (nebo přes zplnomocněného zástupce), zajištění financování zpětného odběru (EPR)' }
      ]
    },

    gpsr: {
      directives: [
        { code: '2023/988', name: 'GPSR — Nařízení o obecné bezpečnosti výrobků', reason: 'Vztahuje se na výrobky určené spotřebitelům', verification: 'doc', verificationNote: 'Primárně posouzení rizik a dokumentace; laboratorní testování je nutné jen pokud je potřeba prokázat konkrétní bezpečnostní riziko, na které se nevztahuje jiná harmonizovaná legislativa.' }
      ],
      docs: [
        { code: 'doc-gpsr-id', text: 'Jméno/ochranná známka výrobce a poštovní i elektronická adresa na výrobku, obalu nebo v průvodním dokladu' },
        { code: 'doc-gpsr-importer', text: 'Údaje dovozce, pokud je výrobce mimo EU', conditional: true },
        { code: 'doc-gpsr-responsible', text: 'EU odpovědná osoba se jménem a kontaktními údaji, pokud je výrobce mimo EU a neexistuje EU dovozce (GPSR čl. 16)', conditional: true },
        { code: 'doc-gpsr-risk', text: 'Interní dokumentace posouzení rizik, uchovávaná min. 10 let' }
      ]
    },

    'category.household': { flags: { gpsrApplies: true } },
    'category.industrial': {
      flags: { gpsrApplies: false },
      notes: [{ level: 'info', text: 'U čistě profesionálního/průmyslového nasazení se GPSR zpravidla neuplatní (chrání spotřebitele). Obsahuje-li zařízení pohyblivé mechanické části, zvažte i Nařízení o strojních zařízeních (EU) 2023/1230.' }]
    },
    'category.medical': {
      flags: { gpsrApplies: true, sectorDisclaimer: 'medical' },
      directives: [{ code: '2017/745', name: 'MDR — nařízení o zdravotnických prostředcích', reason: 'Primární regulatorní rámec pro zdravotnické prostředky', verification: 'test', verificationNote: 'Funkční a bezpečnostní zkoušky, u vyšších rizikových tříd i klinické hodnocení a zapojení notifikované osoby.' }],
      notes: [{ level: 'warning', text: 'Zdravotnické prostředky mají vlastní primární regulatorní rámec — Nařízení (EU) 2017/745 (MDR), příp. (EU) 2017/746 (IVDR) pro diagnostiku in vitro. Tento přehled je pouze obecný doplněk k obecné legislativě pro elektrozařízení a nenahrazuje posouzení dle MDR/IVDR.' }]
    },
    'category.automotive': {
      flags: { gpsrApplies: true, sectorDisclaimer: 'automotive' },
      directives: [{ code: '2018/858', name: 'Nařízení o schvalování motorových vozidel', reason: 'Relevantní rámec pro komponenty podléhající typovému schválení', verification: 'test', verificationNote: 'Homologační zkoušky u zkušebny/technické služby dle příslušného předpisu EHK OSN.' }],
      notes: [{ level: 'warning', text: 'Automobilové aplikace mohou podléhat typovému schvalování vozidel (Nařízení (EU) 2018/858) a příslušným předpisům EHK OSN namísto/vedle obecného CE režimu. Tento přehled je pouze obecný doplněk.' }]
    },
    'category.toy': {
      flags: { gpsrApplies: true, sectorDisclaimer: 'toy' },
      directives: [{ code: '2009/48/ES', name: 'Směrnice o bezpečnosti hraček', reason: 'Primární rámec pro hračky, doplňuje obecné požadavky na elektrozařízení', verification: 'test', verificationNote: 'Laboratorní zkoušky mechanických, chemických a hořlavostních vlastností dle řady EN 71 (a EN 62115 pro elektrické části).' }],
      notes: [{ level: 'warning', text: 'Hračky mají vlastní primární rámec — směrnice 2009/48/ES o bezpečnosti hraček (od r. 2028 nahrazovaná novým Nařízením o bezpečnosti hraček). Tento přehled je pouze obecný doplněk.' }]
    },

    'medical_class.I': { notes: [{ level: 'info', text: 'Třída I (nízké riziko): u většiny prostředků lze provést vlastní posouzení shody bez notifikované osoby (výjimka: sterilní prostředky, prostředky s měřicí funkcí, opakovaně použitelné chirurgické nástroje).' }] },
    'medical_class.IIa': { notes: [{ level: 'warning', text: 'Třída IIa (střední riziko): posouzení shody vyžaduje zapojení notifikované osoby.' }] },
    'medical_class.IIb_III': { notes: [{ level: 'warning', text: 'Třída IIb/III (vyšší/vysoké riziko): přísný režim s notifikovanou osobou, u třídy III typicky i klinické hodnocení.' }] },
    'medical_class.unsure': { notes: [{ level: 'warning', text: 'Doporučujeme prostředek klasifikovat dle pravidel v Příloze VIII MDR před dalším postupem — riziková třída zásadně určuje rozsah povinností.' }] },

    'medical_software.yes': {
      standards: [
        { code: 'IEC 62304', name: 'IEC 62304 — softwarový životní cyklus zdravotnických prostředků', category: 'medical', verification: 'doc', verificationNote: 'Procesní norma — shoda se prokazuje dokumentací vývojového procesu a auditem, ne laboratorním testem.' },
        { code: 'IEC 82304-1', name: 'IEC 82304-1 — software samostatně určený jako zdravotnický prostředek', category: 'medical', verification: 'doc', verificationNote: 'Procesní norma — shoda se prokazuje dokumentací a validací, ne laboratorním testem.' }
      ],
      notes: [{ level: 'info', text: 'Software kvalifikovaný jako MDSW (Medical Device Software) podléhá vlastnímu posouzení dle MDR (Příloha VIII, pravidlo 11).' }]
    },
    'medical_software.no': {},

    'automotive_role.component_typeapproval': {
      notes: [{ level: 'warning', text: 'Jako komponenta s vlastním typovým schválením se pravděpodobně neoznačuje CE, ale schvalovacím značením (e-mark) dle příslušného předpisu EHK OSN / Nařízení (EU) 2018/858. Ověřte konkrétní kategorii komponenty u technické zkušebny.' }]
    },
    'automotive_role.aftermarket_accessory': {
      notes: [{ level: 'info', text: 'Jako obecné elektronické příslušenství se uplatní běžný CE režim (LVD/EMC/RED dle dalších odpovědí). Při pevné instalaci do vozidla zvažte i požadavky na EMC vozidel (navazující na předpis EHK č. 10).' }]
    },

    'toy_age.under36m': { notes: [{ level: 'warning', text: 'Pro věkovou kategorii do 36 měsíců platí přísnější požadavky na malé části (riziko udušení) a povinné varování na obalu dle Přílohy V směrnice 2009/48/ES.' }] },
    'toy_age.over36m': {},
    'toy_risk.yes': {
      standards: [{ code: 'EN 62115', name: 'EN 62115 — bezpečnost elektrických hraček', category: 'safety', verification: 'test', verificationNote: 'Laboratorní zkoušky elektrických/tepelných vlastností hračky.' }],
      notes: [{ level: 'info', text: 'Elektrické/elektronické části hračky podléhají normě EN 62115 a specifickým požadavkům Přílohy II směrnice 2009/48/ES.' }]
    },
    'toy_risk.no': {},

    'voltage_ac.low': {
      flags: { lvdInScope: false },
      standards: [{ code: 'EN IEC 62368-1 (doporučeno)', name: 'EN IEC 62368-1 — bezpečnost AV/IT/komunikační techniky (dobrovolně)', category: 'safety', verification: 'test', verificationNote: 'Bezpečnostní zkoušky v laboratoři, byť zde jen dobrovolně.' }],
      notes: [{ level: 'info', text: 'Napětí je pod prahem Směrnice o nízkém napětí (LVD 2014/35/EU — 50 V AC). LVD se přímo neuplatní; obecné požadavky na bezpečnost plynou z GPSR. Doporučeno dobrovolně dodržet EN IEC 62368-1.' }]
    },
    'voltage_ac.mid': {
      flags: { lvdInScope: true },
      directives: [{ code: '2014/35/EU', name: 'LVD — Směrnice o nízkém napětí', reason: 'Napájecí napětí 50–1000 V AC spadá do rozsahu LVD', verification: 'test', verificationNote: 'Bezpečnostní zkoušky v akreditované laboratoři dle příslušné harmonizované normy.' }],
      standards: [{ code: 'EN IEC 62368-1', name: 'EN IEC 62368-1 — bezpečnost ICT/AV/spotřební elektroniky', category: 'safety', verification: 'test', verificationNote: 'Bezpečnostní zkoušky (dielektrická pevnost, teploty, mechanická pevnost aj.) v akreditované laboratoři.' }],
      notes: [{ level: 'info', text: 'Podle typu zařízení může být vhodnější jiná bezpečnostní norma než EN IEC 62368-1 — např. EN 60335 (domácí spotřebiče) nebo EN 61010-1 (laboratorní/měřicí/průmyslové přístroje).' }]
    },
    'voltage_ac.high': {
      flags: { lvdInScope: true },
      directives: [{ code: '2014/35/EU', name: 'LVD — Směrnice o nízkém napětí', reason: 'Napájecí napětí nad 1000 V AC', verification: 'test', verificationNote: 'Bezpečnostní zkoušky v akreditované laboratoři dle příslušné harmonizované normy.' }],
      notes: [{ level: 'warning', text: 'Napětí přesahuje typický rozsah spotřební/ICT elektroniky. LVD Příloha II obsahuje výluky pro některá vysokonapěťová zařízení — doporučeno individuální posouzení.' }]
    },

    'voltage_dc.low': {
      flags: { lvdInScope: false },
      standards: [{ code: 'EN IEC 62368-1 (doporučeno)', name: 'EN IEC 62368-1 — bezpečnost AV/IT/komunikační techniky (dobrovolně)', category: 'safety', verification: 'test', verificationNote: 'Bezpečnostní zkoušky v laboratoři, byť zde jen dobrovolně.' }],
      notes: [{ level: 'info', text: 'Napětí je pod prahem Směrnice o nízkém napětí (LVD 2014/35/EU — 75 V DC). LVD se přímo neuplatní; obecné požadavky na bezpečnost plynou z GPSR. Doporučeno dobrovolně dodržet EN IEC 62368-1.' }]
    },
    'voltage_dc.mid': {
      flags: { lvdInScope: true },
      directives: [{ code: '2014/35/EU', name: 'LVD — Směrnice o nízkém napětí', reason: 'Napájecí napětí 75–1500 V DC spadá do rozsahu LVD', verification: 'test', verificationNote: 'Bezpečnostní zkoušky v akreditované laboratoři dle příslušné harmonizované normy.' }],
      standards: [{ code: 'EN IEC 62368-1', name: 'EN IEC 62368-1 — bezpečnost ICT/AV/spotřební elektroniky', category: 'safety', verification: 'test', verificationNote: 'Bezpečnostní zkoušky (dielektrická pevnost, teploty, mechanická pevnost aj.) v akreditované laboratoři.' }],
      notes: [{ level: 'info', text: 'Podle typu zařízení může být vhodnější jiná bezpečnostní norma než EN IEC 62368-1 — např. EN 60335 (domácí spotřebiče) nebo EN 61010-1 (laboratorní/měřicí/průmyslové přístroje).' }]
    },
    'voltage_dc.high': {
      flags: { lvdInScope: true },
      directives: [{ code: '2014/35/EU', name: 'LVD — Směrnice o nízkém napětí', reason: 'Napájecí napětí nad 1500 V DC', verification: 'test', verificationNote: 'Bezpečnostní zkoušky v akreditované laboratoři dle příslušné harmonizované normy.' }],
      notes: [{ level: 'warning', text: 'Napětí přesahuje typický rozsah spotřební/ICT elektroniky. LVD Příloha II obsahuje výluky pro některá vysokonapěťová zařízení — doporučeno individuální posouzení.' }]
    },

    'wireless.yes': {
      flags: { redApplies: true },
      directives: [{ code: '2014/53/EU', name: 'RED — Směrnice o rádiových zařízeních', reason: 'Zařízení obsahuje rádiový/bezdrátový modul', verification: 'test', verificationNote: 'RF, EMC a bezpečnostní zkoušky v akreditované laboratoři, u nepokrytých požadavků i posouzení notifikovanou osobou.' }],
      standards: [{ code: 'ETSI EN 301 489-1', name: 'ETSI EN 301 489-1 — základní norma EMC pro rádiová zařízení', category: 'radio', verification: 'test', verificationNote: 'EMC zkoušky v laboratoři.' }],
      docs: [{ code: 'doc-red-freq', text: 'Uvedení použitých frekvenčních pásem a maximálního vyzářeného RF výkonu v návodu k použití (RED čl. 10 odst. 8)' }],
      notes: [
        { level: 'info', text: 'Bezpečnostní a EMC cíle odpovídající LVD a EMC jsou u rádiových zařízení pokryty prostřednictvím RED čl. 3 odst. 1 písm. a) a b) — LVD a EMC se proto neuvádí jako samostatné směrnice, příslušné harmonizované normy pro bezpečnost a EMC se ale nadále používají.' },
        { level: 'warning', text: 'Pokud nejsou pokryty všechny základní požadavky harmonizovanými normami, může být nutné zapojení notifikované osoby (RED čl. 17 / Příloha III).' }
      ]
    },
    'wireless.no': {
      flags: { emcApplies: true },
      directives: [{ code: '2014/30/EU', name: 'EMC — Směrnice o elektromagnetické kompatibilitě', reason: 'Zařízení neobsahuje rádiový modul, ale jako elektrický obvod podléhá EMC', verification: 'test', verificationNote: 'EMC zkoušky emisí a odolnosti v akreditované laboratoři.' }],
      standards: [
        { code: 'EN 55032', name: 'EN 55032 — EMC emise, multimediální zařízení', category: 'emc', verification: 'test', verificationNote: 'Zkoušky emisí v EMC laboratoři.' },
        { code: 'EN 55035', name: 'EN 55035 — EMC odolnost, multimediální zařízení', category: 'emc', verification: 'test', verificationNote: 'Zkoušky odolnosti v EMC laboratoři.' }
      ],
      notes: [{ level: 'info', text: 'Pro nemultimediální zařízení může být vhodnější obecná řada EN IEC 61000-6-1 (odolnost) / EN IEC 61000-6-3 (emise). Je-li zařízení napojeno na síť, zvažte i EN IEC 61000-3-2 (harmonické) a EN IEC 61000-3-3 (flikr).' }]
    },

    'wireless_tech.wifi_bt': { standards: [
      { code: 'ETSI EN 300 328', name: 'ETSI EN 300 328 — širokopásmová přenosová zařízení 2,4 GHz', category: 'radio', verification: 'test', verificationNote: 'Zkoušky RF parametrů (výkon, spektrální maska aj.) v laboratoři.' },
      { code: 'ETSI EN 301 893', name: 'ETSI EN 301 893 — RLAN 5 GHz', category: 'radio', verification: 'test', verificationNote: 'Zkoušky RF parametrů v laboratoři.' }
    ] },
    'wireless_tech.cellular': { standards: [
      { code: 'ETSI EN 301 908', name: 'ETSI EN 301 908 (dle generace sítě) — mobilní komunikační zařízení', category: 'radio', verification: 'test', verificationNote: 'Zkoušky RF parametrů v laboratoři, obvykle vč. operátorské certifikace.' }
    ] },
    'wireless_tech.lora_subghz': { standards: [
      { code: 'ETSI EN 300 220', name: 'ETSI EN 300 220 — krátkodosahová zařízení do 1000 MHz', category: 'radio', verification: 'test', verificationNote: 'Zkoušky RF parametrů v laboratoři.' }
    ] },
    'wireless_tech.rfid_nfc': { standards: [
      { code: 'ETSI EN 300 330 / EN 302 291', name: 'ETSI EN 300 330 nebo EN 302 291 — RFID/NFC zařízení', category: 'radio', verification: 'test', verificationNote: 'Zkoušky RF parametrů v laboratoři.' }
    ] },
    'wireless_tech.other': { notes: [{ level: 'warning', text: 'U netypických rádiových technologií ověřte aktuální harmonizovanou normu v seznamu zveřejněném v Úředním věstníku EU pro RED.' }] },

    'battery.embedded': {
      directives: [{ code: '2023/1542', name: 'Nařízení o bateriích', reason: 'Zařízení obsahuje vestavěnou baterii/akumulátor', verification: 'test', verificationNote: 'Elektrické, bezpečnostní a výkonnostní zkoušky baterie v laboratoři, doplněné požadovanou dokumentací (DoC, due-diligence).' }],
      markings: [
        { code: 'CE-battery', label: 'CE dle Nařízení o bateriích', reason: 'Povinné od 18. 8. 2024' },
        { code: 'battery-symbols', label: 'Symboly baterie (přeškrtnutá popelnice + chem. symboly Pb/Cd/Hg dle přítomnosti)', reason: 'Povinné označení baterie' }
      ],
      docs: [
        { code: 'doc-battery-doc', text: 'DoC pro Nařízení o bateriích (lze sloučit s ostatními do jednoho dokumentu)' },
        { code: 'doc-battery-diligence', text: 'Prohlášení o politice náležité péče (due-diligence) — jen pro větší hospodářské subjekty nad obratovým prahem', conditional: true },
        { code: 'doc-battery-carbon', text: 'Deklarace uhlíkové stopy — podmíněně, hlavně u větších kategorií baterií (EV, LMT, průmyslové > 2 kWh); u malých vestavěných baterií obvykle nerelevantní', conditional: true }
      ],
      notes: [{ level: 'warning', text: 'Od 18. 2. 2027 musí být přenosné baterie ve většině spotřebičů snadno vyjímatelné a nahraditelné koncovým uživatelem (s výjimkami pro vlhké prostředí, kontinuální napájení apod.) — u nevyjímatelné baterie ověřte, zda se na produkt vztahuje výjimka.' }]
    },
    'battery.removable': {
      directives: [{ code: '2023/1542', name: 'Nařízení o bateriích', reason: 'Zařízení obsahuje vyměnitelnou baterii/akumulátor', verification: 'test', verificationNote: 'Elektrické, bezpečnostní a výkonnostní zkoušky baterie v laboratoři, doplněné požadovanou dokumentací (DoC, due-diligence).' }],
      markings: [
        { code: 'CE-battery', label: 'CE dle Nařízení o bateriích', reason: 'Povinné od 18. 8. 2024' },
        { code: 'battery-symbols', label: 'Symboly baterie (přeškrtnutá popelnice + chem. symboly Pb/Cd/Hg dle přítomnosti)', reason: 'Povinné označení baterie' }
      ],
      docs: [
        { code: 'doc-battery-doc', text: 'DoC pro Nařízení o bateriích (lze sloučit s ostatními do jednoho dokumentu)' },
        { code: 'doc-battery-diligence', text: 'Prohlášení o politice náležité péče (due-diligence) — jen pro větší hospodářské subjekty nad obratovým prahem', conditional: true }
      ],
      notes: [{ level: 'info', text: 'Požadavek na snadnou vyjímatelnost baterie koncovým uživatelem je již splněn.' }]
    },
    'battery.none': {},

    'food_contact.yes': {
      directives: [
        { code: 'ES 1935/2004', name: 'Rámcové nařízení o materiálech pro styk s potravinami (FCM)', reason: 'Zařízení přichází do přímého kontaktu s potravinami', verification: 'test', verificationNote: 'Migrační zkoušky (celková a specifická migrace) v potravinových simulantech dle podmínek skutečného použití.' },
        { code: 'ES 2023/2006', name: 'GMP — správná výrobní praxe pro FCM', reason: 'Vztahuje se na výrobu materiálů/předmětů určených pro styk s potravinami', verification: 'doc', verificationNote: 'Dokumentace výrobního procesu a systému kvality (GMP), bez nutnosti zkoušení hotového výrobku.' },
        { code: 'EU 10/2011', name: 'Nařízení o plastových materiálech a předmětech pro styk s potravinami', reason: 'Uplatní se, je-li díl v kontaktu s potravinou vyroben z plastu (pozitivní seznam látek, migrační limity)', verification: 'test', verificationNote: 'Migrační zkoušky specifické pro plast v příslušných potravinových simulantech.' }
      ],
      markings: [
        { code: 'FCM-symbol', label: 'Piktogram „sklenička a vidlička“', reason: 'Povinné označení materiálů pro styk s potravinami, není-li určení výrobku ke styku s potravinou zjevné' }
      ],
      docs: [
        { code: 'doc-fcm-doc', text: 'Prohlášení o shodě pro styk s potravinami (DoC FCM) — samostatný dokument od DoC pro CE' },
        { code: 'doc-fcm-trace', text: 'Sledovatelnost materiálu/dílu v kontaktu s potravinou v celém dodavatelském řetězci' }
      ],
      notes: [
        { level: 'warning', text: 'Legislativa o styku s potravinami je nezávislá na CE režimu pro elektrozařízení a běží souběžně s ním. Pro materiály bez harmonizované EU úpravy (kov, sklo, keramika, silikon) se často uplatní národní legislativa (v ČR vyhláška MZd) — ověřte požadavky cílového členského státu.' }
      ]
    },
    'food_contact.no': {}
  };

  var STANDARD_CATEGORY_LABELS = {
    safety: 'Bezpečnost',
    emc: 'EMC',
    radio: 'Rádio',
    rohs: 'RoHS technická dokumentace',
    medical: 'Zdravotnické prostředky'
  };

  var SECTOR_DISCLAIMER_LABELS = {
    medical: 'Zdravotnický prostředek — primárním rámcem je MDR (EU) 2017/745, příp. IVDR (EU) 2017/746.',
    automotive: 'Automobilová aplikace — primárním rámcem je typové schvalování vozidel (Nařízení (EU) 2018/858) a předpisy EHK OSN.',
    toy: 'Hračka — primárním rámcem je směrnice 2009/48/ES o bezpečnosti hraček.'
  };

  window.WIZARD = {
    questions: QUESTIONS,
    rules: RULES,
    totalSlots: TOTAL_SLOTS,
    standardCategoryLabels: STANDARD_CATEGORY_LABELS,
    sectorDisclaimerLabels: SECTOR_DISCLAIMER_LABELS
  };
})();
