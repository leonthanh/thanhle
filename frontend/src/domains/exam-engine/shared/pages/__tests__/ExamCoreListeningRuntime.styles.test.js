import createStyles from "../ExamCoreListeningRuntime.styles";

describe("ExamCoreListeningRuntime exam colors", () => {
  test("uses the Gateway book green for question and option badges", () => {
    const styles = createStyles(false, "GATEWAY");

    expect(styles.questionNum.backgroundColor).toBe("#2f7d46");
    expect(styles.optionBadge.backgroundColor).toBe("#2f7d46");
  });

  test("keeps the Cambridge color palette for KET", () => {
    const styles = createStyles(false, "KET");

    expect(styles.questionNum.backgroundColor).toBe("#0e276f");
    expect(styles.optionBadge.backgroundColor).toBe("#0e276f");
  });

  test("uses the Prepare orange accent for question and option badges in both themes", () => {
    const styles = createStyles(false, "PREPARE");
    const darkStyles = createStyles(true, "PREPARE");

    expect(styles.questionNum.backgroundColor).toBe("#c2410c");
    expect(styles.optionBadge.backgroundColor).toBe("#c2410c");
    expect(darkStyles.questionNum.backgroundColor).toBe("#c2410c");
    expect(darkStyles.optionBadge.backgroundColor).toBe("#c2410c");
    expect(styles.playGateButton.background).toBe("#0e276f");
    expect(darkStyles.playGateButton.background).toBe("#4a90d9");
  });
});
