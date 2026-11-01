import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TailoringRun } from "@/types";
import { safeText } from "@/lib/pdf-utils";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  header: { marginBottom: 15, borderBottom: "1pt solid #000", paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#444" },
  scoreLine: { fontSize: 12, marginTop: 5, color: "#16a34a", fontWeight: "bold" },
  row: { flexDirection: "row", marginBottom: 10 },
  column: { flex: 1, paddingRight: 5 },
  colHeader: { fontSize: 11, fontWeight: "bold", marginBottom: 8, textDecoration: "underline" },
  bulletPair: { flexDirection: "row", marginBottom: 8, borderBottom: "0.5pt solid #eee", paddingBottom: 5 },
  cellLeft: { flex: 1, fontSize: 9, lineHeight: 1.3, paddingRight: 5, color: "#444" },
  cellRight: { flex: 1, fontSize: 9, lineHeight: 1.3, paddingLeft: 5 },
  changedBox: { backgroundColor: "#f0fdf4", padding: 3, borderRadius: 2 },
  changedTag: { fontSize: 7, color: "#16a34a", fontWeight: "bold", marginBottom: 2 },
  gapsSection: { marginTop: 20, borderTop: "1pt solid #ccc", paddingTop: 10 },
  gapTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 5 },
  gapItem: { fontSize: 9, marginBottom: 3, lineHeight: 1.3 },
  disclaimer: { marginTop: 20, fontSize: 8, color: "#666", fontStyle: "italic", textAlign: "center" }
});

export default function ComparisonPDF({ run }: { run: TailoringRun }) {
  const { jdProfile, tailoredResume, originalScore, tailoredScore, gaps } = run;

  // Flatten bullets for comparison — with null-safe access throughout
  const bulletPairs: { original: string; tailored: string; changed: boolean }[] = [];
  (tailoredResume.tailoredExperience ?? []).forEach((exp) => {
    (exp.bullets ?? []).forEach((b) => {
      if (!b) return; // skip null/undefined bullet entries
      // Check if user reverted it (Phase 4 compatibility)
      const isReverted = b.confirmed === false;
      const originalText = safeText(b.original);
      const finalTailored = isReverted ? originalText : safeText(b.tailored, originalText);
      const changed = finalTailored !== originalText;
      bulletPairs.push({
        original: originalText,
        tailored: finalTailored,
        changed,
      });
    });
  });

  const highGaps = (gaps ?? []).filter((g) => g && g.importance === "high");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>RESUME SHAPESHIFTER — COMPARISON REPORT</Text>
          <Text style={styles.subtitle}>
            Job: {safeText(jdProfile.jobTitle)} at {safeText(jdProfile.company)}
          </Text>
          <Text style={styles.scoreLine}>
            Score: {originalScore.overallScore} → {tailoredScore.overallScore}
          </Text>
        </View>

        {/* Bullets Comparison */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.colHeader}>ORIGINAL RESUME</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.colHeader}>TAILORED RESUME</Text>
          </View>
        </View>

        {bulletPairs.map((pair, idx) => (
          <View key={idx} style={styles.bulletPair}>
            <Text style={styles.cellLeft}>• {pair.original}</Text>
            <View style={styles.cellRight}>
              {pair.changed ? (
                <View style={styles.changedBox}>
                  <Text style={styles.changedTag}>★ CHANGED</Text>
                  <Text>• {pair.tailored}</Text>
                </View>
              ) : (
                <Text>• {pair.tailored}</Text>
              )}
            </View>
          </View>
        ))}

        {/* Gaps */}
        {highGaps.length > 0 && (
          <View style={styles.gapsSection}>
            <Text style={styles.gapTitle}>HIGH-PRIORITY GAPS (Not Addressed)</Text>
            {highGaps.map((gap, idx) => (
              <Text key={idx} style={styles.gapItem}>
                • {safeText(gap.name)}: {safeText(gap.suggestedAction)}
              </Text>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          DISCLAIMER: Verify all content before use. This tool does not fabricate experience.
          Changes are suggestions based on the provided Job Description.
        </Text>
      </Page>
    </Document>
  );
}
