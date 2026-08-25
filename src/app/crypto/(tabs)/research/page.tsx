import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Screener from "@/components/research/Screener";
import ResearchChat from "@/components/ai/ResearchChat";
import { cryptoNews } from "@/lib/mock/crypto";
import { cryptoResearchPrompts } from "@/lib/ai/suggestedPrompts";
import { Newspaper } from "lucide-react";

export default function CryptoResearchPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Screener
          title="Coin Screener"
          filters={[
            { label: "Category", options: ["Layer 1", "Layer 2", "Stablecoin", "DeFi"] },
            { label: "Market Cap", options: ["Under $1B", "$1B - $50B", "Over $50B"] },
            { label: "24h Change", options: ["Gainers only", "Losers only"] },
          ]}
        />

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Newspaper size={16} className="text-muted" />
            <h2 className="font-heading text-lg text-ink">Market News</h2>
          </CardHeader>
          <CardBody className="!pt-0">
            <div className="divide-y divide-border/70">
              {cryptoNews.map((n) => (
                <div key={n.headline} className="py-3">
                  <p className="text-sm font-medium text-ink leading-snug">{n.headline}</p>
                  <p className="mt-1 text-xs text-muted">
                    {n.source} · {n.time}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <ResearchChat domain="crypto" prompts={cryptoResearchPrompts} />
    </div>
  );
}
