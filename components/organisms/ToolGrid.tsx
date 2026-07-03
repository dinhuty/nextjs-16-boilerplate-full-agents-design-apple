import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { ReleaseIcon, SqlIcon, DiffIcon } from "@/components/atoms/icons";

type Tool = {
  name: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href?: string;
};

const TOOLS: Tool[] = [
  {
    name: "Release Procedure",
    description:
      "Dựng & lưu checklist release từ template tam ngữ (JA/EN/VI). Tự điền link PR từ danh sách branch.",
    icon: ReleaseIcon,
    href: "/release-procedure",
  },
  {
    name: "SQL Runner",
    description: "Chạy các đoạn SQL trên database đã cấu hình.",
    icon: SqlIcon,
  },
  {
    name: "Env Diff",
    description: "So sánh biến môi trường giữa các environment.",
    icon: DiffIcon,
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const live = Boolean(tool.href);
  return (
    <div
      className={`group relative flex h-full flex-col gap-sm rounded-xl border bg-canvas p-lg transition-all duration-150 ${
        live
          ? "border-hairline hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          : "border-hairline opacity-60"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <tool.icon className="h-6 w-6" />
        </div>
        {live ? (
          <span className="text-heading-5 text-primary opacity-0 transition-opacity group-hover:opacity-100">
            →
          </span>
        ) : (
          <span className="rounded-full bg-surface px-xs py-xxs text-micro-uppercase text-stone">
            Soon
          </span>
        )}
      </div>
      <h3 className="text-heading-5 text-ink">{tool.name}</h3>
      <p className="text-body-sm text-steel">{tool.description}</p>
    </div>
  );
}

export function ToolGrid() {
  return (
    <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
      {TOOLS.map((tool) =>
        tool.href ? (
          <Link key={tool.name} href={tool.href} className="block">
            <ToolCard tool={tool} />
          </Link>
        ) : (
          <ToolCard key={tool.name} tool={tool} />
        ),
      )}
    </div>
  );
}
