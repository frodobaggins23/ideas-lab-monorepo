import { useReducer } from 'react';

import { DoneScreen } from '@/components/DoneScreen';
import { IntroScreen } from '@/components/IntroScreen';
import { SenseScreen } from '@/components/SenseScreen';
import { initialState, sessionReducer } from '@/grounding/session';

export function App(): React.JSX.Element {
    const [state, dispatch] = useReducer(sessionReducer, initialState);

    if (state.phase === 'intro') {
        return <IntroScreen onStart={() => dispatch({ type: 'start' })} />;
    }
    if (state.phase === 'done') {
        return <DoneScreen onRestart={() => dispatch({ type: 'restart' })} />;
    }
    return <SenseScreen key={state.senseIndex} state={state} dispatch={dispatch} />;
}
