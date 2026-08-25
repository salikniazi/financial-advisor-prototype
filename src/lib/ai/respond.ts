import { totals, currentNetWorth, netWorthByMonth } from "@/lib/mock/netWorth";
import { totalFilerSavings } from "@/lib/mock/tax";
import { formatPKR } from "@/lib/format";

export type AIAction = { label: string; href: string };
export type AIReply = { text: string; actions?: AIAction[] };

type Rule = {
  test: (msg: string) => boolean;
  reply: (pathname: string) => AIReply;
};

const stocksSectorConcentration = () => {
  // Tech-heavy example derived from mock holdings (SYS + TRG ~ tech)
  return 34;
};

const rules: Rule[] = [
  {
    test: (m) => /net worth/.test(m) && /(drop|down|fall|decrease|less)/.test(m),
    reply: () => {
      const series = netWorthByMonth();
      // series is most-recent-first, so index 0 is the current month
      const latest = series[0].value;
      const prev = series[1]?.value ?? latest;
      const delta = latest - prev;
      const direction = delta >= 0 ? "grew" : "dropped";
      return {
        text: `Your net worth ${direction} by ${formatPKR(Math.abs(delta), { compact: true })} this month. The biggest mover was your Vehicle category (depreciation) and Crypto (market volatility) — your Bank and Property balances stayed roughly flat. Nothing here looks unusual for a normal month.`,
        actions: [{ label: "See full breakdown", href: "/" }],
      };
    },
  },
  {
    test: (m) => /(idle cash|sitting idle|cash.*doing nothing|spare cash)/.test(m),
    reply: () => ({
      text: `You have ${formatPKR(totals.bank, { compact: true })} sitting across your bank accounts, and a chunk of that has been idle for 3+ months. At current inflation, idle cash quietly loses value. It may be worth exploring a money market fund or fixed deposit for the portion you don't need liquid — want to see options?`,
      actions: [{ label: "Explore money market funds", href: "/mutual-funds/explore" }],
    }),
  },
  {
    test: (m) => /(overexposed|concentration|diversif|too much.*(tech|sector))/.test(m),
    reply: () => {
      const c = stocksSectorConcentration();
      return {
        text: `Your stock portfolio is about ${c}% weighted toward Technology & IT (SYS, TRG). That's a fair bit of concentration in one sector. It may be worth looking into diversification — want to see analysts' top picks for 2026 in other sectors?`,
        actions: [{ label: "See analysts' top picks", href: "/stocks/research" }],
      };
    },
  },
  {
    test: (m) => /(filer|non.?filer|should i file|tax.*save|save.*tax)/.test(m),
    reply: () => ({
      text: `You should file as a filer this year — based on your banking, property, and dividend activity, it would save you approximately ${formatPKR(totalFilerSavings, { compact: true })} versus staying a non-filer. That's a clear, quantifiable win, not a close call.`,
      actions: [{ label: "See the full comparison", href: "/tax/filer-impact" }],
    }),
  },
  {
    test: (m) => /needs.?input/.test(m),
    reply: () => ({
      text: `"Needs input" means Lime couldn't auto-source that line from your connected data — usually agricultural property, business capital, or mortgages we don't track. Fill it in manually or leave a remark for your accountant.`,
    }),
  },
  {
    test: (m) => /(net worth)/.test(m),
    reply: () => ({
      text: `Your current net worth is ${formatPKR(currentNetWorth, { compact: true })}. Assets are led by Property and Stocks; your only liabilities are a small auto loan, credit card balances, and a BNPL plan — all manageable relative to your assets.`,
      actions: [{ label: "Open Net Worth overview", href: "/" }],
    }),
  },
  {
    test: (m) => /(crypto)/.test(m) && /(take me|go to|show|open)/.test(m),
    reply: () => ({ text: `Here's your crypto portfolio.`, actions: [{ label: "Open Crypto", href: "/crypto" }] }),
  },
  {
    test: (m) => /(last year.*tax|tax return|filing history)/.test(m),
    reply: () => ({ text: `Here's your filing history.`, actions: [{ label: "Open Filing History", href: "/tax/filing-history" }] }),
  },
  {
    test: (m) => /(stocks?|portfolio)/.test(m) && /(take me|go to|show|open)/.test(m),
    reply: () => ({ text: `Here's your stock portfolio.`, actions: [{ label: "Open Stocks", href: "/stocks" }] }),
  },
  {
    test: (m) => /(gold)/.test(m) && /(take me|go to|show|open)/.test(m),
    reply: () => ({ text: `Here's your gold holdings.`, actions: [{ label: "Open Gold", href: "/gold" }] }),
  },
  {
    test: (m) => /(property)/.test(m) && /(take me|go to|show|open)/.test(m),
    reply: () => ({ text: `Here's your property portfolio.`, actions: [{ label: "Open Property", href: "/property" }] }),
  },
  {
    test: (m) => /(tax)/.test(m) && /(take me|go to|show|open|file)/.test(m),
    reply: () => ({ text: `Here's your tax filing workspace.`, actions: [{ label: "Open Tax Filing", href: "/tax" }] }),
  },
];

function contextualFallback(pathname: string): AIReply {
  if (pathname === "/") {
    return {
      text: `This is your net worth overview — Total Assets minus Total Liabilities, tracked month over month. Ask me things like "why did my net worth drop this month?" or click any row for details.`,
    };
  }
  if (pathname.startsWith("/stocks")) {
    return {
      text: `You're in Stocks. I can tell you about your holdings, sector concentration, or general PSX moves. Try asking "am I overexposed to any sector?"`,
    };
  }
  if (pathname.startsWith("/crypto")) {
    return {
      text: `You're in Crypto. Ask me about your holdings, or how Pakistan's evolving virtual asset regulation (PVARA) might affect you.`,
    };
  }
  if (pathname.startsWith("/tax")) {
    return {
      text: `You're in Tax Filing. Ask me what a "needs input" line means, or whether becoming a filer is worth it for you.`,
    };
  }
  return {
    text: `I can explain what's on this screen, pull data from anywhere in Lime, or take you somewhere else — try "how much idle cash do I have?" or "take me to my crypto holdings."`,
  };
}

export function getAIReply(message: string, pathname: string): AIReply {
  const m = message.toLowerCase();
  for (const rule of rules) {
    if (rule.test(m)) return rule.reply(pathname);
  }
  return contextualFallback(pathname);
}

export const suggestedPrompts = [
  "Why did my net worth drop this month?",
  "How much idle cash do I have?",
  "Am I overexposed to any sector?",
  "Should I become a tax filer?",
  "Take me to my crypto holdings",
];
