import type { Sense } from '@/grounding/senses';

export interface SenseText {
    /** Rendered as `<count> <prefix> <verb>`, the verb is highlighted. */
    prefix: string;
    verb: string;
    prompt: string;
    examples: string;
}

export interface Messages {
    intro: { title: string; body: string; note: string; begin: string };
    sense: {
        back: string;
        step: (current: number, total: number) => string;
        examplesLabel: string;
        hint: string;
        action: string;
        breathing: string;
        settled: string;
        next: string;
        finish: string;
        circles: string;
    };
    done: { title: string; body: string; note: string; restart: string };
    languageLabel: string;
    senses: Record<Sense['id'], SenseText>;
}
