# C4 · B.2.2 — Customer Diversity

**Goal:** use the `build-customer-crossref` Copilot skill to build an anonymised customer list and
a cross-reference table from sample attribution data, satisfying control B.2.2.
**Time:** ~45 minutes.

> The full walkthrough lives on the course site at **C4 · B.2.2 Customer Diversity**.
> This README is the terminal-first quick-reference.

## Control

| Control | Requirement                                                      | Evidence                        |
| ------- | ---------------------------------------------------------------- | ------------------------------- |
| B.2.2   | ≥ 3 unique SAP customers with valid PAL / DPOR / CSP attribution | Customer list + cross-reference |

## Prerequisites

- C3 complete (or sample data available).
- Access to sample data in `labs/challenge-4-customer-diversity/sample-data/`.

## Steps

1. **Review sample customer data**

   ```bash
   cat labs/challenge-4-customer-diversity/sample-data/customers.json \
     | python3 -m json.tool | head -60
   ```

2. **Build the customer list and cross-reference**

   Open Copilot Chat:

   ```text
   @lab-coach Run the build-customer-crossref skill on
   labs/challenge-4-customer-diversity/sample-data/customers.json.
   Produce:
   1. An anonymised customer list table
   2. A cross-reference table linking each customer to their B.1.1 case study
   3. Flag any potentially ineligible attribution
   ```

3. **Verify attribution for each customer**

   - PAL: `az managementpartner show` on the customer's subscription
   - DPOR: Partner Center → Customers → [customer] → Subscriptions
   - CSP: Partner Center → Customers (direct billing relationship)

4. **Save the evidence file**

   ```bash
   mkdir -p labs/challenge-4-customer-diversity/evidence
   echo "# B.2.2 — Customer Diversity Evidence" \
     > labs/challenge-4-customer-diversity/evidence/B22_CustomerList_v1.md
   # Paste Copilot's output below the header
   ```

## Sample data

| File                         | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| `sample-data/customers.json` | 3 fictitious customers: Contoso (PAL), Fabrikam (DPOR), Northwind (CSP) |

Each customer record contains: `customerId`, `alias`, `industry`, `attributionType`, `mpnId`,
`subscriptionId`, `sapSystems`, `b11CaseStudyRef`.

## Definition of done

- [ ] Three customers identified, each with a distinct attribution type.
- [ ] Customer list table produced (anonymised).
- [ ] Cross-reference table links each customer to a B.1.1 case study.
- [ ] No unresolved INELIGIBLE flags.
- [ ] `labs/challenge-4-customer-diversity/evidence/B22_CustomerList_v1.md` exists.

## Trainer notes

- Government subscriptions via PAL may not be B.2.2 eligible — flag if trainees ask.
- DPOR records expire; Partner Center shows an expiry date. Check for records > 24 months old.
- A single customer with multiple subscriptions counts as **one** customer.
