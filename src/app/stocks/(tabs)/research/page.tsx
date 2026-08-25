import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Screener from "@/components/research/Screener";
import ResearchChat from "@/components/ai/ResearchChat";
import { stockNews } from "@/lib/mock/stocks";
import { stockResearchPrompts } from "@/lib/ai/suggestedPrompts";
import { Newspaper } from "lucide-react";

export default function StocksResearchPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Screener
          title="Stock Screener"
          filters={[
            { label: "Sector", options: ["Commercial Banks", "Exploration & Production", "Technology & IT", "Fertilizer", "Cement"] },
            { label: "P/E Ratio", options: ["Under 5", "5 - 10", "10 - 20", "Over 20"] },
            { label: "Dividend Yield", options: ["Under 5%", "5% - 10%", "Over 10%"] },
            { label: "Market Cap", options: ["Small Cap", "Mid Cap", "Large Cap"] },
          ]}
        />

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Newspaper size={16} className="text-muted" />
            <h2 className="font-heading text-lg text-ink">Market News</h2>
          </CardHeader>
          <CardBody className="!pt-0">
            <div className="divide-y divide-border/70">
              {stockNews.map((n) => (
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

      <ResearchChat domain="stocks" prompts={stockResearchPrompts} />
    </div>
  );
}
