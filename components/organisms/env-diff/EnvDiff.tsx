"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/atoms/Input";
import { TextArea } from "@/components/atoms/TextArea";

// Parse a .env / KEY=VALUE config into a map (ignoring comments + blanks,
// stripping surrounding quotes). Entirely client-side — nothing is uploaded.
function parseEnv(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out.set(key, val);
  }
  return out;
}

type Status = "added" | "removed" | "changed" | "same";

const STATUS_STYLE: Record<Status, string> = {
  added: "text-brand-green-deep",
  removed: "text-brand-error",
  changed: "text-brand-warn",
  same: "text-stone",
};
const STATUS_LABEL: Record<Status, string> = {
  added: "+ thêm",
  removed: "− mất",
  changed: "~ đổi",
  same: "giống",
};

export function EnvDiff() {
  const [nameA, setNameA] = useState("A");
  const [nameB, setNameB] = useState("B");
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [hideSame, setHideSame] = useState(true);

  const { rows, counts } = useMemo(() => {
    const a = parseEnv(textA);
    const b = parseEnv(textB);
    const keys = [...new Set([...a.keys(), ...b.keys()])].sort();
    const c: Record<Status, number> = { added: 0, removed: 0, changed: 0, same: 0 };
    const r = keys.map((k) => {
      const av = a.get(k);
      const bv = b.get(k);
      let status: Status;
      if (av === undefined) status = "added";
      else if (bv === undefined) status = "removed";
      else if (av !== bv) status = "changed";
      else status = "same";
      c[status]++;
      return { key: k, av, bv, status };
    });
    return { rows: r, counts: c };
  }, [textA, textB]);

  const shown = hideSame ? rows.filter((r) => r.status !== "same") : rows;

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-1 gap-md md:grid-cols-2">
        {(
          [
            { name: nameA, setName: setNameA, text: textA, setText: setTextA },
            { name: nameB, setName: setNameB, text: textB, setText: setTextB },
          ] as const
        ).map((side, i) => (
          <div key={i} className="flex min-w-0 flex-col gap-xs">
            <Input
              value={side.name}
              onChange={(e) => side.setName(e.target.value)}
              placeholder={`Tên môi trường ${i === 0 ? "A" : "B"}`}
              className="max-w-[16rem]"
            />
            <TextArea
              mono
              rows={14}
              value={side.text}
              onChange={(e) => side.setText(e.target.value)}
              placeholder={"KEY=value\nANOTHER_KEY=value"}
            />
          </div>
        ))}
      </div>

      {rows.length > 0 ? (
        <div className="flex flex-col gap-sm">
          <div className="flex flex-wrap items-center gap-md">
            <span className="text-body-sm text-slate">
              <span className="text-brand-green-deep">{counts.added} thêm</span>{" "}
              ·{" "}
              <span className="text-brand-error">{counts.removed} mất</span> ·{" "}
              <span className="text-brand-warn">{counts.changed} đổi</span> ·{" "}
              <span className="text-stone">{counts.same} giống</span>
            </span>
            <label className="ml-auto flex cursor-pointer items-center gap-xxs text-caption text-steel">
              <input
                type="checkbox"
                checked={hideSame}
                onChange={(e) => setHideSame(e.target.checked)}
              />
              Ẩn key giống nhau
            </label>
          </div>

          <div className="overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full min-w-[40rem] border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft text-left text-caption text-stone">
                  <th className="px-md py-sm font-medium">Trạng thái</th>
                  <th className="px-md py-sm font-mono font-medium">Key</th>
                  <th className="px-md py-sm font-medium">{nameA || "A"}</th>
                  <th className="px-md py-sm font-medium">{nameB || "B"}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.key} className="border-b border-hairline-soft">
                    <td
                      className={`whitespace-nowrap px-md py-sm text-caption ${STATUS_STYLE[r.status]}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </td>
                    <td className="px-md py-sm font-mono text-ink">{r.key}</td>
                    <td className="px-md py-sm font-mono text-slate">
                      {r.av ?? ""}
                    </td>
                    <td
                      className={`px-md py-sm font-mono ${
                        r.status === "changed" ? "text-brand-warn" : "text-slate"
                      }`}
                    >
                      {r.bv ?? ""}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-md py-lg text-center text-body-sm text-stone"
                    >
                      Không có khác biệt.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-body-sm text-stone">
          Dán nội dung 2 file để so sánh.
        </p>
      )}
    </div>
  );
}
