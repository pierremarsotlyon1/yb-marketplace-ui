export function formatTs(ts: number | string | null | undefined) {
    if (!ts) return "";
    const d = new Date(Number(ts) * 1000);
    return d.toLocaleString();
}
export function formatBig(n: string | number | bigint) {
    try {
        const x = typeof n === "bigint" ? n : BigInt(n);
        return x.toString();
    } catch {
        return String(n);
    }
}

export function formatToken(weiLike: string, decimals = 18, precision = 4) {
    if (!weiLike) return "0";
    try {
        const neg = weiLike.startsWith("-");
        const raw = neg ? weiLike.slice(1) : weiLike;
        const padded = raw.padStart(decimals + 1, "0");
        const int = padded.slice(0, -decimals);
        const frac = padded.slice(-decimals).replace(/0+$/, "");
        const pretty = frac ? `${int}.${frac}` : int;
        const num = Number(pretty);
        return `${neg ? "-" : ""}${num.toLocaleString(undefined, { maximumFractionDigits: precision })}`;
    } catch {
        return weiLike;
    }
}