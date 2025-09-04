-- Indexer och constraint för bättre prestanda och dataintegritet

-- Shifts: vanliga filter och sortering
CREATE INDEX IF NOT EXISTS idx_shifts_case_active ON shifts(case_id) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

-- Cases: aktiva filter
CREATE INDEX IF NOT EXISTS idx_cases_active ON cases(active);

-- Customers: aktiva filter
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(active);

-- Unikt aktivt ärende per kombination (customer, effort, handlers)
-- Hanterar NULL för handler2 genom COALESCE
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_case
ON cases (customer_id, effort_id, handler1_id, COALESCE(handler2_id, 0))
WHERE active = TRUE;

