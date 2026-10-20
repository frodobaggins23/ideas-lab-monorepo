import { Button, Container } from '@lab/ui';
import { useState } from 'react';

export function App(): React.JSX.Element {
    const [count, setCount] = useState(0);

    return (
        <Container>
            <h1 className="text-2xl font-semibold">__APP_TITLE__</h1>
            <p className="mt-2 text-slate-600">Replace this screen with the idea.</p>
            <Button className="mt-6" onClick={() => setCount((value) => value + 1)}>
                Clicked {count} times
            </Button>
        </Container>
    );
}
