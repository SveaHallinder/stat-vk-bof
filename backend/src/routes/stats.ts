import { Router } from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth";
import { validateSearchParams, sanitizeTextInputs } from "../middleware/validation";

export default function stats(pool: Pool) {
  const router = Router();
  router.use(authenticateToken);

  // Statistik: summeringar
  router.get("/summary", sanitizeTextInputs, validateSearchParams, async (req, res) => {
    const { from, to, insats, effortCategory, gender, birthYear, customer, handler } = req.query;
    let where = "WHERE shifts.active = TRUE";
    const params: any[] = [];

    if (from) {
      params.push(String(from));
      where += ` AND shifts.date >= $${params.length}::date`;
    }
    if (to) {
      params.push(String(to));
      where += ` AND shifts.date <= $${params.length}::date`;
    }
    if (insats && insats !== "alla") {
      params.push(insats);
      where += ` AND cases.effort_id = $${params.length}`;
    }
    if (effortCategory) {
      const categories = String(effortCategory).split(",");
      const likeConditions = categories.map((_, index) => 
        `efforts.available_for ILIKE $${params.length + index + 1}`
      ).join(" OR ");
      
      where += ` AND (${likeConditions})`;
      params.push(...categories.map(cat => `%${cat.trim()}%`));
    }
    if (gender) {
      const genders = String(gender).split(",");
      where += ` AND customers.gender = ANY($${params.length + 1})`;
      params.push(genders);
    }
    if (birthYear) {
      const years = String(birthYear).split(",").map(Number);
      where += ` AND customers.birth_year = ANY($${params.length + 1})`;
      params.push(years);
    }
    if (customer) {
      const customers = String(customer).split(",").map(Number);
      where += ` AND cases.customer_id = ANY($${params.length + 1})`;
      params.push(customers);
    }
    if (handler) {
      const handlers = String(handler).split(",").map(Number);
      where += ` AND (cases.handler1_id = ANY($${params.length + 1}) OR cases.handler2_id = ANY($${params.length + 1}))`;
      params.push(handlers);
    }

    try {
      const baseQuery = `
        FROM shifts
        LEFT JOIN cases ON shifts.case_id = cases.id
        LEFT JOIN efforts ON cases.effort_id = efforts.id
        LEFT JOIN customers ON cases.customer_id = customers.id
        ${where}
      `;

      // Antal besök i valt filter
      const besokRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);

      // Antal kunder med aktiva ärenden inom vald kategori (med filter)
      const kunderRes = await pool.query(`SELECT COUNT(DISTINCT cases.customer_id) ${baseQuery}`, params);

      // Genomsnittlig tid
      const tidRes = await pool.query(`SELECT AVG(shifts.hours) ${baseQuery}`, params);

      // Avbokningsgrad
      const avbokRes = await pool.query(
        `SELECT COUNT(*) FILTER (WHERE shifts.status = 'Avbokad') AS avbok,
                COUNT(*) AS total ${baseQuery}`,
        params
      );

      const antal_besok = Number(besokRes.rows[0].count) || 0;
      const antal_kunder = Number(kunderRes.rows[0].count) || 0;
      const genomsnittlig_tid = Math.round(Number(tidRes.rows[0].avg) * 60) || 0;
      const avbokningar = Number(avbokRes.rows[0].avbok) || 0;
      const total = Number(avbokRes.rows[0].total) || 1;
      const avbokningsgrad = Math.round((avbokningar / total) * 100);

      res.json({
        antal_besok,
        antal_kunder,
        genomsnittlig_tid,
        avbokningsgrad,
      });
    } catch (err) {
      console.error("Fel i /stats/summary:", err);
      res.status(500).json({ error: "Kunde inte hämta statistik" });
    }
  });

  // Statistik: per insats
  router.get("/by-effort", async (req, res) => {
    const { from, to, insats, effortCategory, gender, birthYear, customer, handler } = req.query;
    let where = "WHERE shifts.active = TRUE";
    const params: any[] = [];
    if (from) {
      params.push(String(from));
      where += ` AND shifts.date >= $${params.length}::date`;
    }
    if (to) {
      params.push(String(to));
      where += ` AND shifts.date <= $${params.length}::date`;
    }
    if (insats && insats !== "alla") {
      params.push(insats);
      where += ` AND cases.effort_id = $${params.length}`;
    }
    if (effortCategory) {
      const categories = String(effortCategory).split(",");
      const likeConditions = categories.map((_, index) => 
        `efforts.available_for ILIKE $${params.length + index + 1}`
      ).join(" OR ");
      
      where += ` AND (${likeConditions})`;
      params.push(...categories.map(cat => `%${cat.trim()}%`));
    }
    if (gender) {
      const genders = String(gender).split(",");
      where += ` AND customers.gender = ANY($${params.length + 1})`;
      params.push(genders);
    }
    if (birthYear) {
      const years = String(birthYear).split(",").map(Number);
      where += ` AND customers.birth_year = ANY($${params.length + 1})`;
      params.push(years);
    }
    if (customer) {
      const customers = String(customer).split(",").map(Number);
      where += ` AND cases.customer_id = ANY($${params.length + 1})`;
      params.push(customers);
    }
    if (handler) {
      const handlers = String(handler).split(",").map(Number);
      where += ` AND (cases.handler1_id = ANY($${params.length + 1}) OR cases.handler2_id = ANY($${params.length + 1}))`;
      params.push(handlers);
    }
    try {
      const result = await pool.query(
        `SELECT efforts.id AS effort_id, efforts.name AS effort_name,
          COUNT(shifts.id) AS antal_besok,
          COALESCE(SUM(shifts.hours), 0) AS antal_timmar,
          COUNT(DISTINCT cases.customer_id) AS antal_kunder
        FROM cases
        LEFT JOIN shifts ON cases.id = shifts.case_id
        LEFT JOIN efforts ON cases.effort_id = efforts.id
        LEFT JOIN customers ON cases.customer_id = customers.id
        ${where}
        GROUP BY efforts.id, efforts.name
        ORDER BY efforts.name ASC`,
        params
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching by-effort stats:", err);
      res.status(500).json({ error: "Kunde inte hämta statistik per insats" });
    }
  });

  // Statistik: per månad
  router.get("/by-month", async (req, res) => {
    const { from, to, insats } = req.query;
    let where = "WHERE cases.active = TRUE";
    const params: any[] = [];
    if (from) {
      params.push(from);
      where += ` AND cases.created_at >= $${params.length}::date`;
    }
    if (to) {
      params.push(to);
      where += ` AND cases.created_at <= $${params.length}::date`;
    }
    if (insats && insats !== "alla") {
      params.push(insats);
      where += ` AND cases.effort_id = $${params.length}`;
    }
    try {
      const result = await pool.query(
        `SELECT EXTRACT(YEAR FROM cases.created_at) AS year, EXTRACT(MONTH FROM cases.created_at) AS month,
          COUNT(cases.id) AS antal_besok,
          COUNT(DISTINCT cases.customer_id) AS antal_kunder
        FROM cases
        ${where}
        GROUP BY year, month
        ORDER BY year, month`,
        params
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching by-month stats:", err);
      res.status(500).json({ error: "Kunde inte hämta statistik per månad" });
    }
  });

  // Statistik: per behandlare
  router.get("/by-handler", async (req, res) => {
    const { from, to, insats } = req.query;
    let where = "WHERE cases.active = TRUE";
    const params: any[] = [];
    if (from) {
      params.push(from);
      where += ` AND cases.created_at >= $${params.length}::date`;
    }
    if (to) {
      params.push(to);
      where += ` AND cases.created_at <= $${params.length}::date`;
    }
    if (insats && insats !== "alla") {
      params.push(insats);
      where += ` AND cases.effort_id = $${params.length}`;
    }
    try {
      const result = await pool.query(
        `SELECT h.id AS handler_id, h.name AS handler_name,
          COUNT(cases.id) AS antal_besok,
          COALESCE(SUM(shifts.hours), 0) AS antal_timmar
        FROM cases
        LEFT JOIN handlers h ON cases.handler1_id = h.id
        LEFT JOIN shifts ON cases.id = shifts.case_id AND shifts.active = TRUE
        ${where}
        GROUP BY h.id, h.name
        ORDER BY h.name ASC`,
        params
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching by-handler stats:", err);
      res.status(500).json({ error: "Kunde inte hämta statistik per behandlare" });
    }
  });

  return router;
}