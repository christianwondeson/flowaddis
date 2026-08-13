type Listener = (count: number, label: string | null) => void;

let active = 0;
let label: string | null = null;
const listeners = new Set<Listener>();

function emit() {
    for (const l of listeners) l(active, label);
}

/** Global in-flight request counter for admin / booking fetch UX. */
export const requestLoading = {
    subscribe(fn: Listener) {
        listeners.add(fn);
        fn(active, label);
        return () => {
            listeners.delete(fn);
        };
    },
    begin(nextLabel?: string) {
        active += 1;
        if (nextLabel) label = nextLabel;
        emit();
    },
    end() {
        active = Math.max(0, active - 1);
        if (active === 0) label = null;
        emit();
    },
};

export async function withRequestLoading<T>(
    fn: () => Promise<T>,
    nextLabel?: string,
): Promise<T> {
    requestLoading.begin(nextLabel);
    try {
        return await fn();
    } finally {
        requestLoading.end();
    }
}
