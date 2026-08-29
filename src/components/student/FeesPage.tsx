"use client";

import { useState } from "react";
import { Check, CircleAlert, Clock3, CreditCard, ShieldCheck, X, QrCode, Building2, CheckCircle2 } from "lucide-react";

interface InvoiceItem {
  id: string;
  subject: string;
  teacher: string;
  period: string;
  amount: string;
  dueDate: string;
  status: "Due" | "Paid";
}

const invoiceData: InvoiceItem[] = [
  {
    id: "inv-01",
    subject: "Pure Mathematics",
    teacher: "Mr. K. Perera",
    period: "August 2026",
    amount: "Rs. 4,500",
    dueDate: "31 Aug 2026",
    status: "Due",
  },
  {
    id: "inv-02",
    subject: "Organic Chemistry",
    teacher: "Ms. A. Fernando",
    period: "August 2026",
    amount: "Rs. 3,800",
    dueDate: "31 Aug 2026",
    status: "Due",
  },
  {
    id: "inv-03",
    subject: "Pure Mathematics",
    teacher: "Mr. K. Perera",
    period: "July 2026",
    amount: "Rs. 4,500",
    dueDate: "31 Jul 2026",
    status: "Paid",
  },
  {
    id: "inv-04",
    subject: "Organic Chemistry",
    teacher: "Ms. A. Fernando",
    period: "July 2026",
    amount: "Rs. 3,800",
    dueDate: "31 Jul 2026",
    status: "Paid",
  },
];

export function FeesPage() {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"select" | "processing" | "success">("select");
  const [selectedMethod, setSelectedMethod] = useState<"card" | "qr" | "bank">("card");

  function handleOpenPayment() {
    setPaymentStep("select");
    setPaymentModalOpen(true);
  }

  function handleProcessPayment() {
    setPaymentStep("processing");
    setTimeout(() => {
      setPaymentStep("success");
    }, 1200);
  }

  return (
    <div className="fees-page-wrapper">
      {/* Page Header */}
      <header className="fees-header">
        <p className="fees-eyebrow">BILLING</p>
        <h1 className="fees-title">Fees &amp; Payments</h1>
      </header>

      {/* Summary Metrics Cards */}
      <div className="billing-summary-grid">
        {/* Card 1: Total Outstanding */}
        <article className="billing-card-dark">
          <span className="card-label-dark">TOTAL OUTSTANDING</span>
          <strong className="card-amount-dark">Rs. 12,800</strong>
          <p className="card-subtext-dark">Due this month</p>
          <button
            className="pay-now-btn"
            type="button"
            onClick={handleOpenPayment}
          >
            Pay now
          </button>
        </article>

        {/* Card 2: Paid this term */}
        <article className="billing-card-light">
          <div className="icon-badge icon-badge-green">
            <Check size={22} strokeWidth={2.6} />
          </div>
          <span className="card-label-light">Paid this term</span>
          <strong className="card-amount-light">Rs. 11,500</strong>
          <p className="card-subtext-green">All clear ✓</p>
        </article>

        {/* Card 3: Overdue */}
        <article className="billing-card-light">
          <div className="icon-badge icon-badge-red">
            <CircleAlert size={22} strokeWidth={2.4} />
          </div>
          <span className="card-label-light">Overdue</span>
          <strong className="card-amount-light">Rs. 4,500</strong>
          <p className="card-subtext-red">Action required</p>
        </article>
      </div>

      {/* Invoice History Section */}
      <section className="invoice-history-section" aria-labelledby="invoice-heading">
        <h2 id="invoice-heading" className="invoice-history-heading">Invoice history</h2>

        <div className="invoice-table-card">
          {/* Header Row */}
          <div className="invoice-row invoice-head-row">
            <span>SUBJECT</span>
            <span>PERIOD</span>
            <span>AMOUNT</span>
            <span>DUE DATE</span>
            <span>STATUS</span>
          </div>

          {/* Table Data Rows */}
          {invoiceData.map((invoice) => (
            <div className="invoice-row invoice-body-row" key={invoice.id}>
              <div className="invoice-subject-cell">
                <strong className="subject-title">{invoice.subject}</strong>
                <span className="teacher-name">{invoice.teacher}</span>
              </div>

              <div className="invoice-period-cell">
                <span>{invoice.period}</span>
              </div>

              <div className="invoice-amount-cell">
                <strong>{invoice.amount}</strong>
              </div>

              <div className="invoice-date-cell">
                <Clock3 size={15} className="clock-icon" />
                <span>{invoice.dueDate}</span>
              </div>

              <div className="invoice-status-cell">
                <span
                  className={
                    invoice.status === "Paid"
                      ? "status-badge status-badge-paid"
                      : "status-badge status-badge-due"
                  }
                >
                  {invoice.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Pay Modal */}
      {paymentModalOpen && (
        <div className="payment-modal-backdrop" onClick={() => setPaymentModalOpen(false)}>
          <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-head">
              <div>
                <h3>Pay Class Fees</h3>
                <p>Tuition payment for August 2026</p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setPaymentModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {paymentStep === "select" && (
              <div className="payment-modal-body">
                <div className="payment-total-box">
                  <span>Total Payable</span>
                  <strong>Rs. 12,800</strong>
                </div>

                <div className="payment-breakdown">
                  <div className="breakdown-item">
                    <span>Pure Mathematics (August)</span>
                    <strong>Rs. 4,500</strong>
                  </div>
                  <div className="breakdown-item">
                    <span>Organic Chemistry (August)</span>
                    <strong>Rs. 3,800</strong>
                  </div>
                  <div className="breakdown-item overdue-item">
                    <span>Physics (Overdue Balance)</span>
                    <strong>Rs. 4,500</strong>
                  </div>
                </div>

                <div className="payment-methods-list">
                  <label
                    className={`method-option ${selectedMethod === "card" ? "method-option-active" : ""}`}
                    onClick={() => setSelectedMethod("card")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedMethod === "card"}
                      onChange={() => setSelectedMethod("card")}
                    />
                    <CreditCard size={18} />
                    <span>Credit / Debit Card (Visa / Mastercard)</span>
                  </label>

                  <label
                    className={`method-option ${selectedMethod === "qr" ? "method-option-active" : ""}`}
                    onClick={() => setSelectedMethod("qr")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedMethod === "qr"}
                      onChange={() => setSelectedMethod("qr")}
                    />
                    <QrCode size={18} />
                    <span>LankaQR / Mobile Banking App</span>
                  </label>

                  <label
                    className={`method-option ${selectedMethod === "bank" ? "method-option-active" : ""}`}
                    onClick={() => setSelectedMethod("bank")}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={selectedMethod === "bank"}
                      onChange={() => setSelectedMethod("bank")}
                    />
                    <Building2 size={18} />
                    <span>Direct Bank Slip Upload</span>
                  </label>
                </div>

                <div className="security-notice">
                  <ShieldCheck size={16} />
                  <span>256-bit encrypted secure classroom payment gateway</span>
                </div>

                <button
                  type="button"
                  className="confirm-pay-btn"
                  onClick={handleProcessPayment}
                >
                  Pay Rs. 12,800 Now
                </button>
              </div>
            )}

            {paymentStep === "processing" && (
              <div className="payment-modal-body modal-center-body">
                <div className="spinner" />
                <h4>Processing Secure Payment...</h4>
                <p>Please wait while we connect to the banking portal.</p>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="payment-modal-body modal-center-body">
                <div className="success-icon-wrap">
                  <CheckCircle2 size={48} />
                </div>
                <h4>Payment Successful!</h4>
                <p>Your receipt #EP-2026-8841 has been issued and sent to your email.</p>
                <button
                  type="button"
                  className="confirm-pay-btn"
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
