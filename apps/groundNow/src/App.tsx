import { useReducer } from 'react';

import { DoneScreen } from '@/components/DoneScreen';
import { IntroScreen } from '@/components/IntroScreen';
import { SenseScreen } from '@/components/SenseScreen';
import { initialState, sessionReducer } from '@/grounding/session';
import { I18nProvider } from '@/i18n/I18nProvider';

export function App(): React.JSX.Element {
    const [state, dispatch] = useReducer(sessionReducer, initialState);

    return (
        <I18nProvider>
            {state.phase === 'intro' && <IntroScreen onStart={() => dispatch({ type: 'start' })} />}
            {state.phase === 'sense' && (
                <SenseScreen key={state.senseIndex} state={state} dispatch={dispatch} />
            )}
            {state.phase === 'done' && (
                <DoneScreen onRestart={() => dispatch({ type: 'restart' })} />
            )}
        </I18nProvider>
    );
}
