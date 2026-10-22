import type { Messages } from './messages';

export const cs: Messages = {
    intro: {
        title: 'Jsi tady. Teď a tady je to v pořádku.',
        body: 'Vraťme tvou pozornost do přítomnosti, jeden smysl po druhém. Zabere to asi dvě minuty.',
        note: 'Žádné správné odpovědi neexistují. Přibližně stačí a žádný krok nemusíš opakovat.',
        begin: 'Začít uzemnění',
    },
    sense: {
        back: '← Zpět',
        step: (current, total) => `Krok ${current} z ${total}`,
        examplesLabel: 'Například',
        hint: 'Nespěchej. Klepni, až si jich všimneš.',
        action: 'Všímám si jich',
        breathing: 'Nádech… a výdech.',
        settled: 'Výborně. Zůstaň tu ještě chvilku.',
        next: 'Další smysl',
        finish: 'Dokončit',
        circles: 'Všimnuté věci',
    },
    done: {
        title: 'Jsi zpátky v přítomnosti.',
        body: 'Myšlenky tu mohou být dál a nevadí to. Nemusíš je odhánět ani řešit. Pokračuj v tom, na čem ti záleží.',
        note: 'Pokud je to příliš, zvaž oslovení terapeuta nebo někoho, komu věříš.',
        restart: 'Zpět na začátek',
    },
    languageLabel: 'Jazyk',
    senses: {
        see: {
            prefix: 'věcí, které',
            verb: 'vidíš',
            prompt: 'Rozhlédni se pomalu. Najdi věci, které vidíš.',
            examples: 'hrnek, stín, modrá kniha, tvoje bota',
        },
        touch: {
            prefix: 'věci, kterých se můžeš',
            verb: 'dotknout',
            prompt: 'Všimni si, co teď cítí tvé tělo.',
            examples: 'džíny, chladný stůl, chodidla na podlaze',
        },
        hear: {
            prefix: 'věci, které',
            verb: 'slyšíš',
            prompt: 'Poslouchej pozorně. Nech zvuky, ať k tobě přijdou.',
            examples: 'bzučící lednička, ptáci, tvůj dech',
        },
        smell: {
            prefix: 'vůně, které',
            verb: 'cítíš',
            prompt: 'Pomalu se nadechni. Všimni si případné vůně.',
            examples: 'káva, mýdlo, starý papír, oblečení',
        },
        taste: {
            prefix: 'chuť, kterou',
            verb: 'vnímáš',
            prompt: 'Všimni si chuti v ústech, nebo se napij vody.',
            examples: 'máta, káva, voda',
        },
    },
};
