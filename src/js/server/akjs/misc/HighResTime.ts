export type HighResTime = Readonly<[number, number]>;

function normalizeHighResTime(t: HighResTime): HighResTime {
    let [secs, nanos] = t;

    while (nanos < 0) {
        secs -= 1;
        nanos += 1e9;
    }

    while (nanos >= 1e9) {
        secs += 1;
        nanos -= 1e9;
    }

    return [secs, nanos];
}

export function subtractHighResTimes(t1: HighResTime, t2: HighResTime): HighResTime {
    return normalizeHighResTime([t1[0] - t2[0], t1[1] - t2[1]]);
}

export function addHighResTimes(t1: HighResTime, t2: HighResTime): HighResTime {
    return normalizeHighResTime([t1[0] + t2[0], t1[1] + t2[1]]);
}

export function highResTimeToSeconds(t: HighResTime): number {
    return t[0] + t[1] / 1e9;
}

export function highResTimeFromSeconds(secs: number): HighResTime {
    const s = Math.floor(secs);
    const n = Math.floor(secs * 1e9 - s * 1e9);
    return [s, n];
}

export function highResTimeToMilliseconds(t: HighResTime): number {
    return t[0] * 1000 + t[1] / 1e6;
}

export function highResTimeFromMilliseconds(milliseconds: number): HighResTime {
    const s = Math.floor(milliseconds / 1000);
    const n = Math.floor(milliseconds * 1e6 - s * 1e9);
    return [s, n];
}
