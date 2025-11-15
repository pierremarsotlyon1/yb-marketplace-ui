export const formatUsd = (number: number | string, minimumFractionDigits: number = 2, maximumFractionDigits: number = 2): string => {

    let data: any = number;
    if(typeof number === "string") {
        data = parseFloat(number)
    }

    if(data === 0) {
        return "0";
    }
    
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(data);
}