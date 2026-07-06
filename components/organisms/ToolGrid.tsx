import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  ReleaseIcon,
  SqlIcon,
  DiffIcon,
  TaskIcon,
} from "@/components/atoms/icons";

type Tool = {
  name: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent: string;
  href?: string;
  colorful?: boolean;
};

const TOOLS: Tool[] = [
  {
    name: "Release Procedure",
    description:
      "Dựng & lưu checklist release từ template tam ngữ (JA/EN/VI). Tự điền link PR từ danh sách branch.",
    icon: ReleaseIcon,
    accent: "#00836b",
    href: "/release-procedure",
  },
  {
    name: "SQL Runner",
    description:
      "Thư viện SQL snippet (theo acm-tools) để copy về máy tự chạy. Thêm/sửa/xoá được.",
    icon: SqlIcon,
    accent: "#2f6fd0",
    href: "/sql-runner",
  },
  {
    name: "Task Manager",
    description:
      "Lưu task cá nhân: link Slack, review, release procedure, document, note. Riêng tư.",
    icon: TaskIcon,
    accent: "#7c3aed",
    href: "/tasks",
    colorful: true,
  },
  {
    name: "Env Diff",
    description:
      "Dán 2 file .env/config → so sánh key (thêm / mất / đổi). Xử lý ngay trên trình duyệt, không gửi lên server.",
    icon: DiffIcon,
    accent: "#c2410c",
    href: "/env-diff",
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  const live = Boolean(tool.href);
  return (
    <div
      className={`group flex h-full flex-col gap-sm rounded-xl border bg-canvas p-lg transition-all duration-150 ${
        live ? "hover:-translate-y-0.5 hover:shadow-md" : "opacity-60"
      }`}
      style={{ borderColor: live ? `${tool.accent}33` : "#e5e5e5" }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{
            backgroundColor: tool.colorful ? "transparent" : `${tool.accent}1a`,
          }}
        >
          <tool.icon
            className={tool.colorful ? "h-8 w-8" : "h-6 w-6"}
            style={tool.colorful ? undefined : { color: tool.accent }}
          />
        </div>
        {live ? (
          <span
            className="text-heading-5 opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: tool.accent }}
          >
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
