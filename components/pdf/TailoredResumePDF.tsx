import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TailoringRun } from "@/types";

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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{contact.name}</Text>
          <View style={styles.contactRow}>
            {contact.email && <Text>{contact.email}</Text>}
            {contact.phone && <Text>• {contact.phone}</Text>}
            {contact.location && <Text>• {contact.location}</Text>}
            {contact.linkedin && <Text>• {contact.linkedin}</Text>}
            {contact.github && <Text>• {contact.github}</Text>}
          </View>
        </View>

        {/* Summary */}
        {tailoredSummary && (
          <View>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.textBlock}>{tailoredSummary}</Text>
          </View>
        )}

        {/* Skills */}
        {tailoredSkills && tailoredSkills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.textBlock}>{tailoredSkills.join(" • ")}</Text>
          </View>
        )}

        {/* Experience */}
        {tailoredExperience && tailoredExperience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Experience</Text>
            {tailoredExperience.map((exp, idx) => {
              // Find matching dates from original profile
              const origExp = run.resumeProfile.experience.find(
                (e) => e.company === exp.company && e.title === exp.title
              );
              return (
                <View key={idx} style={styles.entry}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{exp.company}</Text>
                    <Text style={styles.entryDates}>
                      {origExp ? `${origExp.startDate} - ${origExp.endDate}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.entrySubtitle}>{exp.title}</Text>
                  {exp.bullets.map((bullet, bIdx) => {
                    // For Phase 4 compatibility: if confirmed is false, fall back to original
                    const textToUse = bullet.confirmed === false ? bullet.original : bullet.tailored;
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
                  <Text style={styles.entryTitle}>{proj.name}</Text>
                </View>
                {proj.description && (
                  <Text style={styles.entrySubtitle}>{proj.description}</Text>
                )}
                {proj.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={styles.bullet}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
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
                  <Text style={styles.entryTitle}>{edu.institution}</Text>
                  <Text style={styles.entryDates}>{edu.graduationDate}</Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {edu.degree} in {edu.field}
                  {edu.gpa ? ` (GPA: ${edu.gpa})` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <Text style={styles.textBlock}>{certifications.join(" • ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
