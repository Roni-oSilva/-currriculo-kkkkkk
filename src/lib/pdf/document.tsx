import React from "react";
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData, ResumeDesign, SectionKey } from "@/lib/resume/schema";
import { SECTION_LABELS, accentHex } from "@/lib/resume/schema";
import { getTemplate } from "@/lib/resume/templates";
import { brl, contactItems, formatMonth, formatPeriod, lines, visibleSections } from "@/lib/resume/format";

// Evita quebrar palavras com hífen automático (prejudica leitura por ATS).
Font.registerHyphenationCallback((word) => [word]);

export const previewWatermark = (priceCents: number) => `PRÉVIA — DESBLOQUEIE POR ${brl(priceCents)}`;

export interface ResumePdfProps {
  data: ResumeData;
  design: ResumeDesign;
  /** Bytes JPEG/PNG da foto (já validada). */
  photo?: Buffer | null;
  watermark?: string | null;
  title?: string;
}

const INK = "#111827";
const MUTED = "#4b5563";
/** Seções que vão para a barra lateral nos modelos de duas colunas. */
const SIDE_SECTIONS: SectionKey[] = ["skills", "languages", "courses", "certifications", "awards"];

/** Mistura a cor com branco (amount 0 = cor original, 1 = branco). */
export function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function ResumePdf({ data, design, photo, watermark, title }: ResumePdfProps) {
  const t = getTemplate(design.template);
  const accent = accentHex(design.accent);
  const fs = t.baseFontSize;
  const bold = t.font === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold";
  const italic = t.font === "Times-Roman" ? "Times-Italic" : "Helvetica-Oblique";
  const withPhoto = Boolean(photo) && design.showPhoto && t.supportsPhoto;
  const sections = visibleSections(data, design);
  const p = data.personal;
  const sidebar = t.layout !== "single";
  const solid = sidebar && t.sidebarTone === "solid";
  const sideBg = solid ? accent : tint(accent, 0.9);
  const sideInk = solid ? "#ffffff" : INK;
  const sideMuted = solid ? tint(accent, 0.8) : MUTED;
  const sideLine = solid ? tint(accent, 0.55) : accent;

  const s = StyleSheet.create({
    item: { marginBottom: 7 },
    itemHead: { flexDirection: "row", justifyContent: "space-between" },
    itemTitle: { fontFamily: bold, flexShrink: 1 },
    bullet: { flexDirection: "row", marginTop: 1.5 },
    bulletDot: { width: 10 },
    bulletText: { flex: 1 },
  });

  const radius = t.photoShape === "circle" ? t.photoSize / 2 : t.photoShape === "rounded" ? 14 : 0;
  const photoStyle = { width: t.photoSize, height: t.photoSize, borderRadius: radius, objectFit: "cover" as const };

  const Heading = ({ children, side }: { children: string; side?: boolean }) => {
    const base = { fontFamily: bold, fontSize: fs * (side ? 0.98 : 1.1), textTransform: "uppercase" as const, letterSpacing: side ? 1 : 0.9 };
    if (side)
      return (
        <View minPresenceAhead={40} style={{ borderBottomWidth: 1, borderBottomColor: sideLine, paddingBottom: 2, marginBottom: 5 }}>
          <Text style={{ ...base, color: solid ? "#ffffff" : accent }}>{children}</Text>
        </View>
      );
    switch (t.heading) {
      case "underline":
        return <View minPresenceAhead={50} style={{ borderBottomWidth: 1, borderBottomColor: accent, marginBottom: 5, paddingBottom: 2 }}><Text style={{ ...base, color: accent }}>{children}</Text></View>;
      case "bar":
        return <View minPresenceAhead={50} style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}><View style={{ width: 4, height: 13, backgroundColor: accent, marginRight: 6 }} /><Text style={{ ...base, color: accent }}>{children}</Text></View>;
      case "side-line":
        return <View minPresenceAhead={50} style={{ borderLeftWidth: 4, borderLeftColor: accent, backgroundColor: tint(accent, 0.9), paddingVertical: 3, paddingHorizontal: 8, marginBottom: 6 }}><Text style={{ ...base, color: accent }}>{children}</Text></View>;
      case "tab":
        return <View minPresenceAhead={50} style={{ marginBottom: 6 }}><View style={{ width: 26, height: 3, backgroundColor: accent, marginBottom: 3 }} /><Text style={{ ...base, color: INK }}>{children}</Text></View>;
      default: // caps
        return <View minPresenceAhead={50} style={{ marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: "#9ca3af", paddingBottom: 3 }}><Text style={{ ...base, letterSpacing: 2, color: INK }}>{children}</Text></View>;
    }
  };

  const Bullets = ({ text, muted }: { text: string; muted?: string }) => (
    <>
      {lines(text).map((l, i) => (
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={{ ...s.bulletDot, color: muted }}>•</Text>
          <Text style={s.bulletText}>{l}</Text>
        </View>
      ))}
    </>
  );

  const Row = ({ title: ttl, date, sub, side }: { title: string; date?: string; sub?: string; side?: boolean }) => {
    const m = side ? sideMuted : MUTED;
    return side ? (
      <>
        <Text style={s.itemTitle}>{ttl}</Text>
        {sub ? <Text style={{ color: m, fontFamily: italic }}>{sub}</Text> : null}
        {date ? <Text style={{ color: m, fontSize: fs * 0.92 }}>{date}</Text> : null}
      </>
    ) : (
      <>
        <View style={s.itemHead}>
          <Text style={s.itemTitle}>{ttl}</Text>
          {date ? <Text style={{ color: m, fontSize: fs * 0.92, marginLeft: 8 }}>{date}</Text> : null}
        </View>
        {sub ? <Text style={{ color: m, fontFamily: italic }}>{sub}</Text> : null}
      </>
    );
  };

  const linkColor = (side?: boolean) => (side && solid ? "#ffffff" : accent);

  const body = (key: SectionKey, side: boolean): React.ReactNode => {
    switch (key) {
      case "objective":
        return <Text style={{ marginTop: 2 }}>{data.objective.summary}</Text>;
      case "experience":
        return data.experience.filter((e) => e.company || e.role).map((e) => (
          <View key={e.id} style={s.item}>
            <View wrap={false}>
              <Row title={[e.role, e.company].filter(Boolean).join(" — ")} date={formatPeriod(e.start, e.end, e.current, "atual")} sub={e.city} />
              {lines(e.activities)[0] ? <Bullets text={lines(e.activities)[0]} /> : null}
            </View>
            <Bullets text={lines(e.activities).slice(1).join("\n")} />
            {lines(e.achievements).length ? (
              <>
                <Text style={{ fontFamily: bold, marginTop: 3 }}>Resultados e conquistas</Text>
                <Bullets text={e.achievements} />
              </>
            ) : null}
          </View>
        ));
      case "education":
        return data.education.filter((e) => e.institution || e.course).map((e) => (
          <View key={e.id} style={s.item} wrap={false}>
            <Row side={side} title={[e.course, e.level].filter(Boolean).join(" — ") || e.institution} date={formatPeriod(e.start, e.end, e.current, "em andamento")} sub={e.course ? e.institution : undefined} />
          </View>
        ));
      case "courses":
        return data.courses.filter((c) => c.name).map((c) => (
          <View key={c.id} style={s.item} wrap={false}>
            <Row side={side} title={c.name} date={formatMonth(c.completedAt)} sub={[c.institution, c.hours ? `${c.hours}h` : ""].filter(Boolean).join(" • ")} />
            {c.certificateUrl ? <Link src={c.certificateUrl} style={{ color: linkColor(side), textDecoration: "none" }}>{c.certificateUrl.replace(/^https?:\/\//, "")}</Link> : null}
          </View>
        ));
      case "skills": {
        const groups: [string, string[]][] = [
          ["Habilidades técnicas", data.skills.technical],
          ["Ferramentas e tecnologias", data.skills.tools],
          ["Competências interpessoais", data.skills.soft],
          ["Conhecimentos da área", data.skills.domain],
        ];
        return groups.filter(([, l]) => l.length).map(([label, l]) =>
          side ? (
            <View key={label} style={{ marginBottom: 5 }}><Text style={{ fontFamily: bold }}>{label}</Text><Text>{l.join(", ")}</Text></View>
          ) : (
            <Text key={label} style={{ marginTop: 2 }}><Text style={{ fontFamily: bold }}>{label}: </Text>{l.join(", ")}</Text>
          ),
        );
      }
      case "languages":
        return side
          ? data.extras.languages.filter((l) => l.name).map((l) => <Text key={l.id}>{l.level ? `${l.name} (${l.level})` : l.name}</Text>)
          : <Text style={{ marginTop: 2 }}>{data.extras.languages.filter((l) => l.name).map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(" • ")}</Text>;
      case "projects":
        return data.extras.projects.filter((x) => x.name).map((x) => (
          <View key={x.id} style={s.item} wrap={false}>
            <Row title={x.name} />
            {x.description ? <Text>{x.description}</Text> : null}
            {x.url ? <Link src={x.url} style={{ color: linkColor(side), textDecoration: "none" }}>{x.url.replace(/^https?:\/\//, "")}</Link> : null}
          </View>
        ));
      case "volunteer":
        return data.extras.volunteer.filter((x) => x.organization || x.role).map((x) => (
          <View key={x.id} style={s.item} wrap={false}>
            <Row title={[x.role, x.organization].filter(Boolean).join(" — ")} date={x.period} />
            {x.description ? <Text>{x.description}</Text> : null}
          </View>
        ));
      case "awards":
        return data.extras.awards.filter((x) => x.title).map((x) => (
          <View key={x.id} style={s.item} wrap={false}><Row side={side} title={x.title} date={x.year} sub={x.issuer} /></View>
        ));
      case "publications":
        return data.extras.publications.filter((x) => x.title).map((x) => (
          <View key={x.id} style={s.item} wrap={false}>
            <Row title={x.title} date={x.year} sub={x.venue} />
            {x.url ? <Link src={x.url} style={{ color: linkColor(side), textDecoration: "none" }}>{x.url.replace(/^https?:\/\//, "")}</Link> : null}
          </View>
        ));
      case "certifications":
        return data.extras.certifications.filter((x) => x.name).map((x) => (
          <View key={x.id} style={s.item} wrap={false}><Row side={side} title={x.name} date={x.year} sub={x.issuer} /></View>
        ));
      case "other":
        return <Text style={{ marginTop: 2 }}>{data.extras.other}</Text>;
    }
  };

  const section = (key: SectionKey, side: boolean) => (
    <View key={key} style={{ marginTop: t.sectionGap }}>
      <Heading side={side}>{SECTION_LABELS[key]}</Heading>
      {body(key, side)}
    </View>
  );

  const contacts = contactItems(data);
  const headline = [data.objective.targetRole, data.objective.area].filter(Boolean).join(" • ");
  const photoEl = withPhoto ? <Image src={photo as Buffer} style={photoStyle} /> : null;

  const nameBlock = (align: "left" | "center", color = INK, mutedColor = MUTED, big = 2.1) => (
    <View style={align === "center" ? { width: "100%" } : { width: "100%", flexShrink: 1 }}>
      <Text style={{ fontFamily: bold, fontSize: fs * big, letterSpacing: 0.3, lineHeight: 1.15, color, textAlign: align }}>{p.fullName || "Seu nome"}</Text>
      {headline ? <Text style={{ fontSize: fs * 1.2, marginTop: 5, color: mutedColor, textAlign: align }}>{headline}</Text> : null}
    </View>
  );

  const watermarkEl = watermark ? (
    <View fixed style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      {[0.12, 0.34, 0.56, 0.78].map((y) => (
        <Text key={y} style={{ position: "absolute", top: `${y * 100}%`, left: -40, width: 700, textAlign: "center", fontFamily: "Helvetica-Bold", fontSize: 30, color: "#dc2626", opacity: 0.2, transform: "rotate(-32deg)" }}>
          {watermark}
        </Text>
      ))}
    </View>
  ) : null;

  const docTitle = title ?? `Currículo ${p.fullName}`.trim();

  /* ───────── modelos de duas colunas ───────── */
  if (sidebar) {
    const left = t.layout === "side-left";
    const mainKeys = sections.filter((k) => !SIDE_SECTIONS.includes(k));
    const sideKeys = sections.filter((k) => SIDE_SECTIONS.includes(k));
    const pad = t.pagePadding;
    return (
      <Document title={docTitle} author={p.fullName || undefined} creator="Currículo Certo" producer="Currículo Certo" language="pt-BR">
        <Page size="A4" style={{ fontFamily: t.font, fontSize: fs, color: INK, lineHeight: 1.35, paddingTop: pad, paddingBottom: pad }}>
          <View fixed style={{ position: "absolute", top: 0, bottom: 0, [left ? "left" : "right"]: 0, width: "32%", backgroundColor: sideBg }} />
          {/* O conteúdo principal vem primeiro na árvore: ordem de leitura correta para ATS. */}
          <View style={{ flexDirection: left ? "row-reverse" : "row" }}>
            <View style={{ width: "68%", paddingHorizontal: 26 }}>
              {nameBlock("left", INK, MUTED, t.id === "creative" ? 2.5 : 2.1)}
              <View style={{ width: 34, height: 3, backgroundColor: accent, marginTop: 8 }} />
              {mainKeys.map((k) => section(k, false))}
            </View>
            <View style={{ width: "32%", paddingHorizontal: 16, color: sideInk }}>
              {photoEl ? <View style={{ alignItems: "center", marginBottom: 12 }}>{photoEl}</View> : null}
              {contacts.length ? (
                <View>
                  <Heading side>Contato</Heading>
                  {contacts.map((c) => <Text key={c} style={{ marginBottom: 3 }}>{c}</Text>)}
                </View>
              ) : null}
              {sideKeys.map((k) => (
                <View key={k} style={{ marginTop: t.sectionGap }}>
                  <Heading side>{SECTION_LABELS[k]}</Heading>
                  {body(k, true)}
                </View>
              ))}
            </View>
          </View>
          {watermarkEl}
        </Page>
      </Document>
    );
  }

  /* ───────── modelos de coluna única ───────── */
  let header: React.ReactNode;
  if (t.header === "center") {
    header = (
      <View style={{ alignItems: "center" }}>
        {photoEl ? <View style={{ marginBottom: 8 }}>{photoEl}</View> : null}
        {nameBlock("center")}
        {contacts.length ? <Text style={{ fontSize: fs * 0.92, marginTop: 6, color: MUTED, textAlign: "center" }}>{contacts.join("  |  ")}</Text> : null}
      </View>
    );
  } else if (t.header === "panel") {
    header = (
      <View style={{ backgroundColor: tint(accent, 0.88), borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center" }}>
        {photoEl ? <View style={{ marginRight: 14 }}>{photoEl}</View> : null}
        <View style={{ flex: 1 }}>
          {nameBlock("left", INK, MUTED, 2)}
          {contacts.length ? <Text style={{ fontSize: fs * 0.92, marginTop: 6, color: MUTED }}>{contacts.join("  |  ")}</Text> : null}
        </View>
      </View>
    );
  } else {
    header = (
      <View>
        {nameBlock("left", INK, MUTED, 2.3)}
        {contacts.length ? <Text style={{ fontSize: fs * 0.92, marginTop: 6, color: MUTED }}>{contacts.join("  |  ")}</Text> : null}
      </View>
    );
  }

  return (
    <Document title={docTitle} author={p.fullName || undefined} creator="Currículo Certo" producer="Currículo Certo" language="pt-BR">
      <Page size="A4" style={{ fontFamily: t.font, fontSize: fs, color: INK, padding: t.pagePadding, lineHeight: 1.35 }}>
        {header}
        {sections.map((k) => section(k, false))}
        {watermarkEl}
      </Page>
    </Document>
  );
}
