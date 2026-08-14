import { ShieldCheck } from "lucide-react";

/**
 * App-wide compliance disclaimer. FlowGuard is a software decision-support tool
 * only — it does not hold a payment licence, does not touch or hold funds, and
 * performs no crypto/stablecoin exchange, custody or transfer. All settlement is
 * completed by licensed financial institutions. Rendered in the app footer so it
 * is present on every screen.
 */
export function ComplianceNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mt-6 flex items-start gap-2 rounded-2xl border border-border/60 bg-[color:var(--fg-soft)] p-3 text-[10px] leading-relaxed text-muted-foreground ${className}`}
      data-el="compliance-notice"
    >
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <p>
        <b className="text-foreground">合规说明：</b>
        本平台为纯软件决策辅助工具，专注于付款前合规风险筛查、多持牌通道智能比价选路与结算链路透明化追踪。
        本平台<b>不持有任何支付牌照、不经手或托管资金</b>，<b>不提供任何形式的加密货币/稳定币兑换、托管或转账服务</b>；
        所有资金结算环节均由持牌金融机构完成。平台生成的信息与建议仅供参考，最终以持牌机构的执行结果为准。
      </p>
    </div>
  );
}
