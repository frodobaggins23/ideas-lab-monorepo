import { Container } from '@lab/ui';
import { useState } from 'react';

import { ChallengesPage } from '@/pages/ChallengesPage';
import { LearnPage } from '@/pages/LearnPage';

type Section = 'learn' | 'challenges';

const SECTIONS: { id: Section; label: string }[] = [
    { id: 'learn', label: 'Learn' },
    { id: 'challenges', label: 'Challenges' },
];

const sectionFromHash = (): Section =>
    window.location.hash === '#challenges' ? 'challenges' : 'learn';

export function App(): React.JSX.Element {
    const [section, setSection] = useState<Section>(sectionFromHash);

    const openSection = (next: Section) => {
        setSection(next);
        window.history.replaceState(null, '', `#${next}`);
    };

    return (
        <Container className="space-y-6">
            <header className="space-y-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        <span className="text-red-500">R</span>
                        <span className="text-green-500">G</span>
                        <span className="text-blue-500">B</span> Mixer
                    </h1>
                    <p className="text-slate-400">
                        See how red, green and blue light make every color.
                    </p>
                </div>
                <div
                    role="tablist"
                    aria-label="Sections"
                    className="flex gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10"
                >
                    {SECTIONS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            id={`tab-${id}`}
                            aria-selected={section === id}
                            aria-controls={`panel-${id}`}
                            onClick={() => openSection(id)}
                            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                                section === id
                                    ? 'bg-white text-slate-900'
                                    : 'text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </header>
            <main id={`panel-${section}`} role="tabpanel" aria-labelledby={`tab-${section}`}>
                {section === 'learn' ? <LearnPage /> : <ChallengesPage />}
            </main>
        </Container>
    );
}
