import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes Tailwind com segurança evitando colisões de utilitários
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata valores monetários no padrão de Moçambique: 1.000,00 MZN
 * Não utiliza aproximações float imprecisas
 */
export function formatMoney(amount: number | string | null | undefined, currency = "MZN"): string {
  if (amount === null || amount === undefined || amount === "") {
    return `0,00 ${currency}`;
  }

  // Se for string decimal válida, formata directamente para evitar perda de precisão float
  if (typeof amount === "string") {
    const cleanStr = amount.trim();
    if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
      const [rawInt, rawDec = "00"] = cleanStr.split(".");
      const integerPart = rawInt.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const decimalPart = rawDec.padEnd(2, "0").slice(0, 2);
      return `${integerPart},${decimalPart} ${currency}`;
    }
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (typeof num !== "number" || isNaN(num)) {
    return `0,00 ${currency}`;
  }

  // Formata com separador de milhar '.' e decimal ','
  const parts = num.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalPart = parts[1];

  return `${integerPart},${decimalPart} ${currency}`;
}

/**
 * Formata datas para o formato visual exigido: DD/MM/YYYY
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";

  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
        const [year, month, day] = dateInput.substring(0, 10).split("-");
        return `${day}/${month}/${year}`;
      }
      return String(dateInput);
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}
