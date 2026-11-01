import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TailoringRun } from "@/types";
import { safeText } from "@/lib/pdf-utils";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 10,
    borderBottom: "1pt solid #000",
    paddingBottom: 5,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  contactRow: {
    flexDirection: "row",
    fontSize: 9,
    color: "#444",
    gap: 10,
    marginTop: 4,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    textTransform: "uppercase",
    borderBottom: "1pt solid #ccc",
    paddingBottom: 2,
  },
  textBlock: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  entry: {
    marginBottom: 8,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  entryTitle: {
    fontSize: 10,
    fontWeight: "bold",
  },
  entryDates: {
    fontSize: 9,
    color: "#555",
  },
  entrySubtitle: {
    fontSize: 9,
    fontStyle: "italic",
    marginBottom: 3,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bulletPoint: {
    width: 12,
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.3,
  },
});

export default function TailoredResumePDF({ run }: { run: TailoringRun }) {
  const { contact, projects, education, certifications } = run.resumeProfile;
  const { tailoredSummary, tailoredSkills, tailoredExperience } = run.tailoredResume;

  /**
   * Pre-build a Map<"${company}::${title}", ExperienceEntry> for O(1) date lookups.
   * Keyed by company+title to avoid the O(n²) Array.find() on every render.
   */
  const expDateMap = new Map(
    run.resumeProfile.experience.map((e) => [
      `${e.company}::${e.title}`,
      { startDate: e.startDate, endDate: e.endDate },
    ])
  );

  // Safe, filtered skills list — filter out any non-string values before join
  const safeSkills = (tailoredSkills ?? [])
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .join(" • ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{safeText(contact.name)}</Text>
          <View style={styles.contactRow}>
            {contact.email && <Text>{safeText(contact.email)}</Text>}
            {contact.phone && <Text>• {safeText(contact.phone)}</Text>}
            {contact.location && <Text>• {safeText(contact.location)}</Text>}
            {contact.linkedin && <Text>• {safeText(contact.linkedin)}</Text>}
            {contact.github && <Text>• {safeText(contact.github)}</Text>}
          </View>
        </View>

        {/* Summary */}
        {tailoredSummary && (
          <View>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.textBlock}>{safeText(tailoredSummary)}</Text>
          </View>
        )}

        {/* Skills */}
        {safeSkills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.textBlock}>{safeSkills}</Text>
          </View>
        )}

        {/* Experience */}
        {tailoredExperience && tailoredExperience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Experience</Text>
            {tailoredExperience.map((exp, idx) => {
              // O(1) date lookup via pre-built Map
              const dates = expDateMap.get(`${exp.company}::${exp.title}`);
              const dateRange = dates
                ? `${safeText(dates.startDate)} - ${safeText(dates.endDate)}`
                : "";
              return (
                <View key={idx} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{safeText(exp.company)}</Text>
                    <Text style={styles.entryDates}>{dateRange}</Text>
                  </View>
                  <Text style={styles.entrySubtitle}>{safeText(exp.title)}</Text>
                  {(exp.bullets ?? []).map((bullet, bIdx) => {
                    // For Phase 4 compatibility: if confirmed is false, fall back to original
                    const textToUse =
                      bullet.confirmed === false
                        ? safeText(bullet.original)
                        : safeText(bullet.tailored, safeText(bullet.original));
                    return (
                      <View key={bIdx} style={styles.bullet}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{textToUse}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj, idx) => (
              <View key={idx} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{safeText(proj.name)}</Text>
                </View>
                {proj.description && (
                  <Text style={styles.entrySubtitle}>{safeText(proj.description)}</Text>
                )}
                {(proj.bullets ?? []).map((bullet, bIdx) => (
                  <View key={bIdx} style={styles.bullet}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{safeText(bullet)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{safeText(edu.institution)}</Text>
                  <Text style={styles.entryDates}>{safeText(edu.graduationDate)}</Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {safeText(edu.degree)} in {safeText(edu.field)}
                  {edu.gpa ? ` (GPA: ${safeText(edu.gpa)})` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <Text style={styles.textBlock}>
              {certifications.filter(Boolean).map((c) => safeText(c)).join(" • ")}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
