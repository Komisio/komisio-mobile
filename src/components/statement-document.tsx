import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, uiStyles, Message } from "./ui";
import { useI18n } from "@/lib/i18n";
import {
  agreementLanguages,
  formatAgreementTime,
} from "@/lib/seller-agreement";
import {
  businessFields,
  statementLinesPage,
  statementPeriod,
  statementTitleKey,
  type Invoice,
  type StatementDetail,
  type StatementLine,
} from "@/lib/seller-statements";
import { formatPrice } from "@/lib/catalogue";

function Language({ language }: { language: string | null }) {
  const { d } = useI18n(),
    t = d.statements;
  return (
    <Text style={styles.note}>
      {t.language}:{" "}
      {language
        ? agreementLanguages[language as keyof typeof agreementLanguages]
        : t.unknownLanguage}
    </Text>
  );
}
export function StatementDocument({
  data,
  openOriginal,
}: {
  data: StatementDetail;
  openOriginal: (id: string) => void;
}) {
  const { d, locale } = useI18n(),
    t = d.statements,
    s = data.summary;
  const amount = (ore: number) => formatPrice(ore, data.currency, locale);
  return (
    <>
      <Text accessibilityRole="header" style={styles.heading}>
        {t[statementTitleKey(s)]} #{s.number}
      </Text>
      <Text style={styles.text}>
        {t.period}: {statementPeriod(s, locale)}
      </Text>
      <Text style={styles.note}>
        {t.issuedAt}: {formatAgreementTime(s.issuedAt, locale)}
      </Text>
      <Language language={data.language} />
      <Message>{t.frozen}</Message>
      {s.correctsId ? (
        <Button
          label={`${t.corrects} ${t.original}`}
          variant="secondary"
          onPress={() => openOriginal(s.correctsId!)}
        />
      ) : null}
      <View style={styles.card}>
        {data.contact.length ? (
          data.contact.map((line, index) => (
            <Text selectable key={index} style={styles.text}>
              {line}
            </Text>
          ))
        ) : (
          <Message>{t.legacyContact}</Message>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.amount}>
          {t.opening}: {amount(s.openingOre)}
        </Text>
        {(
          [
            "salesGross",
            "commission",
            "credited",
            "reversed",
            "paid",
            "adjustments",
          ] as const
        ).map((key) => (
          <Text key={key} style={styles.text}>
            {t[key]}: {amount(data.totals[key])}
          </Text>
        ))}
        <Text style={styles.amount}>
          {t.closing}: {amount(s.closingOre)}
        </Text>
      </View>
      {data.invoice ? <InvoiceDetails invoice={data.invoice} /> : null}
      <LedgerLines lines={data.lines} currency={data.currency} />
    </>
  );
}
function PageControls({
  count,
  page,
  setPage,
}: {
  count: number;
  page: number;
  setPage: (page: number) => void;
}) {
  const { d } = useI18n(),
    t = d.statements;
  if (!count) return null;
  return (
    <>
      <Text style={styles.note}>
        {t.entriesPage
          .replace("{from}", String(page * 25 + 1))
          .replace("{to}", String(Math.min((page + 1) * 25, count)))
          .replace("{total}", String(count))}
      </Text>
      {count > 25 ? (
        <>
          <Button
            label={t.previous}
            variant="secondary"
            disabled={page === 0}
            onPress={() => setPage(page - 1)}
          />
          <Button
            label={t.next}
            variant="secondary"
            disabled={(page + 1) * 25 >= count}
            onPress={() => setPage(page + 1)}
          />
        </>
      ) : null}
    </>
  );
}
function LedgerLines({
  lines,
  currency,
}: {
  lines: StatementLine[];
  currency: string;
}) {
  const { d, locale } = useI18n(),
    t = d.statements;
  const [page, setPage] = useState(0);
  const amount = (ore: number | null) =>
    ore === null ? "—" : formatPrice(ore, currency, locale);
  return (
    <>
      <Text accessibilityRole="header" style={styles.heading}>
        {t.lines}
      </Text>
      {!lines.length ? (
        <Message>{t.noLines}</Message>
      ) : (
        statementLinesPage(lines, page).map((line) => (
          <View key={line.id} style={styles.card}>
            <Text style={styles.label}>
              #{line.number} · {t.kinds[line.kind]}
            </Text>
            <Text style={styles.note}>
              {t.date}: {formatAgreementTime(line.at, locale)}
            </Text>
            <Text style={styles.amount}>
              {t.amount}: {amount(line.amountOre)}
            </Text>
            <Text style={styles.text}>
              {t.salePrice}: {amount(line.salePriceOre)}
            </Text>
            <Text style={styles.text}>
              {t.commission}: {amount(line.commissionOre)}
            </Text>
          </View>
        ))
      )}
      <PageControls count={lines.length} page={page} setPage={setPage} />
    </>
  );
}
function InvoiceDetails({ invoice }: { invoice: Invoice }) {
  const { d, locale } = useI18n(),
    t = d.statements;
  const [page, setPage] = useState(0);
  const amount = (ore: number) => formatPrice(ore, invoice.currency, locale);
  return (
    <>
      <Text accessibilityRole="header" style={styles.heading}>
        {t.selfBilling}
      </Text>
      <Language language={invoice.language} />
      <View style={styles.card}>
        <Text style={styles.label}>{t.supplier}</Text>
        {invoice.supplier.map((line, index) => (
          <Text selectable key={index} style={styles.text}>
            {line}
          </Text>
        ))}
        {businessFields
          .filter((key) => invoice.business[key])
          .map((key) => (
            <Text selectable key={key} style={styles.text}>
              {t.business[key]}: {invoice.business[key]}
            </Text>
          ))}
        {invoice.vatRegistered !== null ? (
          <Text style={styles.text}>
            {t.business.vatRegistered}:{" "}
            {invoice.vatRegistered ? t.business.yes : t.business.no}
          </Text>
        ) : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>{t.buyer}</Text>
        {invoice.buyer.map((line, index) => (
          <Text selectable key={index} style={styles.text}>
            {line}
          </Text>
        ))}
      </View>
      <Message>{t.invoiceNote}</Message>
      <Text accessibilityRole="header" style={styles.heading}>
        {t.invoiceTotals}
      </Text>
      {invoice.totals.map((total) => (
        <View key={total.rateBp ?? "none"} style={styles.card}>
          <Text style={styles.text}>
            {t.vatRate}:{" "}
            {total.rateBp === null
              ? t.noSeparateVat
              : `${total.rateBp / 100} %`}
          </Text>
          <Text style={styles.text}>
            {t.supplierNet}: {amount(total.netOre)}
          </Text>
          <Text style={styles.text}>
            {t.supplierVat}:{" "}
            {total.rateBp === null ? "—" : amount(total.vatOre)}
          </Text>
          <Text style={styles.amount}>
            {t.supplierGross}: {amount(total.grossOre)}
          </Text>
        </View>
      ))}
      <Text accessibilityRole="header" style={styles.heading}>
        {t.invoiceLines}
      </Text>
      {!invoice.lines.length ? (
        <Message>{t.noLines}</Message>
      ) : (
        statementLinesPage(invoice.lines, page).map((line) => (
          <View key={line.referenceId} style={styles.card}>
            <Text selectable style={styles.label}>
              {line.description ?? line.saleLineId}
            </Text>
            <Text style={styles.text}>{t.kinds[line.kind]}</Text>
            <Text style={styles.note}>
              {formatAgreementTime(line.at, locale)}
            </Text>
            <Text selectable style={styles.note}>
              {t.source}: {line.saleLineId}
            </Text>
            <Text style={styles.text}>
              {t.vatRate}:{" "}
              {line.rateBp === null
                ? t.noSeparateVat
                : `${line.rateBp / 100} %`}
            </Text>
            {line.vatNumber ? (
              <Text selectable style={styles.text}>
                {t.vatNumber}: {line.vatNumber}
              </Text>
            ) : null}
            <Text style={styles.text}>
              {t.supplierNet}: {amount(line.netOre)}
            </Text>
            <Text style={styles.text}>
              {t.supplierVat}:{" "}
              {line.rateBp === null ? "—" : amount(line.vatOre)}
            </Text>
            <Text style={styles.amount}>
              {t.supplierGross}: {amount(line.grossOre)}
            </Text>
          </View>
        ))
      )}
      <PageControls
        count={invoice.lines.length}
        page={page}
        setPage={setPage}
      />
    </>
  );
}
const styles = StyleSheet.create({
  card: uiStyles.card,
  heading: uiStyles.heading,
  label: uiStyles.rowTitle,
  text: uiStyles.body,
  note: uiStyles.note,
  amount: uiStyles.amount,
});
