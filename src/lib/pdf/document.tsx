import React from "react";
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData, ResumeDesign, SectionKey } from "@/lib/resume/schema";
import { SECTION_LABELS, accentHex } from "@/lib/resume/schema";
import { getTemplate, type TemplateConfig } from "@/lib/resume/templates";
import { contactItems, formatMonth, formatPeriod, lines, location, visibleSections } from "@/lib/resume/format";

// Evita quebrar palavras com hífen automático (prejudica leitura por ATS).
Font.registerHyphenationCallback((word) => [word]);

export const PREVIEW_WATERMARK = "PRÉVIA — DESBLOQUEIE POR R$ 7,99";

export interface ResumePdfProps {
  data: ResumeData;
  design: ResumeDesign;
  /** Bytes JPEG/PNG da foto (já validada). */
  photo?: Buffer | null;
  watermark?: string | null;
  /** Texto exibido em PDFs de exemplo */
  title?: string;
}

const INK = "#111827";
const MUTED = "#4b5563";

function makeStyles(t: TemplateConfig, accent: string) {
  const bold = t.font === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold";
  const italic = t.font === "Times-Roman" ? "Times-Italic" : "Helvetica-Oblique";
  const fs = t.baseFontSize;
  return {
    bold,
    italic,
    s: StyleSheet.create({
      page: { fontFamily: t.font, fontSize: fs, color: INK, padding: t.pagePadding, paddingTop: t.header === "band" ? 0 : t.pagePadding, lineHeight: 1.35 },
      band: { backgroundColor: accent, color: "#ffffff", padding: t.pagePadding, paddingBottom: 18, marginHorizontal: -t.pagePadding, marginBottom: 14 },
      headRow: { flexDirection: "row", alignItems: "center" },
      photo: { width: 74, height: 74, borderRadius: 37, objectFit: "cover", marginRight: 14 },
      photoRight: { width: 74, height: 74, borderRadius: 37, objectFit: "cover", marginLeft: 14 },
      name: { fontFamily: bold, fontSize: fs * 2.1, letterSpacing: 0.3, lineHeight: 1.15 },
      role: { fontSize: fs * 1.2, marginTop: 5 },
      contact: { fontSize: fs * 0.92, marginTop: 6 },
      section: { marginTop: t.sectionGap },
      item: { marginBottom: 7 },
      itemHead: { flexDirection: "row", justifyContent: "space-between" },
      itemTitle: { fontFamily: bold, flexShrink: 1 },
      itemDate: { color: MUTED, fontSize: fs * 0.92, marginLeft: 8 },
      sub: { color: MUTED, fontFamily: italic },
      bullet: { flexDirection: "row", marginTop: 1.5 },
      bulletDot: { width: 10 },
      bulletText: { flex: 1 },
      para: { marginTop: 2 },
      link: { color: accent, textDecoration: "none" },
    }),
  };
}

export function ResumePdf({ data, design, photo, watermark, title }: ResumePdfProps) {
  const t = getTemplate(design.template);
  const accent = accentHex(design.accent);
  const { s, bold } = makeStyles(t, accent);
  const withPhoto = Boolean(photo) && design.showPhoto && t.supportsPhoto;
  const sections = visibleSections(data, design);
  const p = data.personal;
  const onBand = t.header === "band";
  const headColor = onBand ? "#ffffff" : INK;

  const Heading = ({ children }: { children: string }) => {
    const base = { fontFamily: bold, fontSize: t.baseFontSize * 1.1, textTransform: "uppercase" as const, letterSpacing: 0.8 };
    if (t.heading === "underline")
      return <View minPresenceAhead={50} style={{ borderBottomWidth: 1, borderBottomColor: accent, marginBottom: 5, paddingBottom: 2 }}><Text style={{ ...base, color: accent }}>{children}</Text></View>;
    if (t.heading === "bar")
      return <View minPresenceAhead={50} style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}><View style={{ width: 4, height: 13, backgroundColor: accent, marginRight: 6 }} /><Text style={{ ...base, color: accent }}>{children}</Text></View>;
    if (t.heading === "boxed")
      return <View minPresenceAhead={50} style={{ backgroundColor: accent, paddingVertical: 2.5, paddingHorizontal: 6, marginBottom: 6 }}><Text style={{ ...base, color: "#ffffff" }}>{children}</Text></View>;
    return <View minPresenceAhead={50} style={{ marginBottom: 5 }}><Text style={{ ...base, color: INK }}>{children}</Text></View>;
  };

  const Bullets = ({ text }: { text: string }) => (
    <>
      {lines(text).map((l, i) => (
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{l}</Text>
        </View>
      ))}
    </>
  );

  const Row = ({ title: ttl, date, sub }: { title: string; date?: string; sub?: string }) => (
    <>
      <View style={s.itemHead}>
        <Text style={s.itemTitle}>{ttl}</Text>
        {date ? <Text style={s.itemDate}>{date}</Text> : null}
      </View>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </>
  );

  const body = (key: SectionKey): React.ReactNode => {
    switch (key) {
      case "objective":
        return <Text style={s.para}>{data.objective.summary}</Text>;
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
            <Row title={[e.course, e.level].filter(Boolean).join(" — ") || e.institution} date={formatPeriod(e.start, e.end, e.current, "em andamento")} sub={e.course ? e.institution : undefined} />
          </View>
        ));
      case "courses":
        return data.courses.filter((c) => c.name).map((c) => (
          <View key={c.id} style={s.item} wrap={false}>
            <Row title={c.name} date={formatMonth(c.completedAt)} sub={[c.institution, c.hours ? `${c.hours}h` : ""].filter(Boolean).join(" • ")} />
            {c.certificateUrl ? <Link src={c.certificateUrl} style={s.link}>{c.certificateUrl.replace(/^https?:\/\//, "")}</Link> : null}
          </View>
        ));
      case "skills": {
        const groups: [string, string[]][] = [
          ["Habilidades técnicas", data.skills.technical],
          ["Ferramentas e tecnologias", data.skills.tools],
          ["Competências interpessoais", data.skills.soft],
          ["Conhecimentos da área", data.skills.domain],
        ];
        return groups.filter(([, l]) => l.length).map(([label, l]) => (
          <Text key={label} style={s.para}><Text style={{ fontFamily: bold }}>{label}: </Text>{l.join(", ")}</Text>
        ));
      }
      case "languages":
        return <Text style={s.para}>{data.extras.languages.filter((l) => l.name).map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(" • ")}</Text>;
      case "projects":
        return data.extras.projects.filter((x) => x.name).map((x) => (
          <View key={x.id} style={s.item} wrap={false}>
            <Row title={x.name} />
            {x.description ? <Text>{x.description}</Text> : null}
            {x.url ? <Link src={x.url} style={s.link}>{x.url.replace(/^https?:\/\//, "")}</Link> : null}
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
          <View key={x.id} style={s.item} wrap={false}><Row title={x.title} date={x.year} sub={x.issuer} /></View>
        ));
      case "publications":
        return data.extras.publications.filter((x) => x.title).map((x) => (
          <View key={x.id} style={s.item} wrap={false}>
            <Row title={x.title} date={x.year} sub={x.venue} />
            {x.url ? <Link src={x.url} style={s.link}>{x.url.replace(/^https?:\/\//, "")}</Link> : null}
          </View>
        ));
      case "certifications":
        return data.extras.certifications.filter((x) => x.name).map((x) => (
          <View key={x.id} style={s.item} wrap={false}><Row title={x.name} date={x.year} sub={x.issuer} /></View>
        ));
      case "other":
        return <Text style={s.para}>{data.extras.other}</Text>;
    }
  };

  const contacts = contactItems(data);
  const headline = [data.objective.targetRole, data.objective.area].filter(Boolean).join(" • ");
  const align = t.header === "center" ? "center" : "left";

  const identity = (
    <View style={t.header === "center" ? { width: "100%" } : { flex: 1 }}>
      <Text style={{ ...s.name, color: headColor, textAlign: align }}>{p.fullName || "Seu nome"}</Text>
      {headline ? <Text style={{ ...s.role, color: headColor, textAlign: align }}>{headline}</Text> : null}
      {contacts.length ? <Text style={{ ...s.contact, color: onBand ? "#ffffff" : MUTED, textAlign: align }}>{contacts.join("  |  ")}</Text> : null}
    </View>
  );
  const photoEl = withPhoto ? <Image src={photo as Buffer} style={t.header === "center" ? { ...s.photo, alignSelf: "center", marginRight: 0, marginBottom: 8 } : s.photo} /> : null;

  let header: React.ReactNode;
  if (t.header === "center") {
    header = (
      <View style={{ alignItems: "center" }}>
        {photoEl}
        {identity}
      </View>
    );
  } else if (onBand) {
    header = <View style={s.band}><View style={s.headRow}>{photoEl}{identity}</View></View>;
  } else {
    header = <View style={s.headRow}>{photoEl}{identity}</View>;
  }

  return (
    <Document title={title ?? `Currículo ${p.fullName}`.trim()} author={p.fullName || undefined} creator="Currículo Certo" producer="Currículo Certo" language="pt-BR">
      <Page size="A4" style={s.page}>
        {header}
        {sections.map((key) => (
          <View key={key} style={s.section}>
            <Heading>{SECTION_LABELS[key]}</Heading>
            {body(key)}
          </View>
        ))}
        {watermark ? (
          <View fixed style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
            {[0.12, 0.34, 0.56, 0.78].map((y) => (
              <Text
                key={y}
                style={{
                  position: "absolute", top: `${y * 100}%`, left: -40, width: 700, textAlign: "center",
                  fontFamily: "Helvetica-Bold", fontSize: 30, color: "#dc2626", opacity: 0.2,
                  transform: "rotate(-32deg)",
                }}
              >
                {watermark}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export { location };
