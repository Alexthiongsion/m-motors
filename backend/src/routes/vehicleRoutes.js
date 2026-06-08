const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const offerType = req.query.offerType?.trim();

    const values = [];

    let query = `
      SELECT id, brand, model, price, offer_type, is_available, image_url
      FROM vehicles
      WHERE is_available = true
    `;

    if (search) {
      values.push(`%${search}%`);
      query += ` AND (brand ILIKE $${values.length} OR model ILIKE $${values.length})`;
    }

    if (offerType) {
      if (!["purchase", "rental"].includes(offerType)) {
        return res.status(400).json({
          message: "Le type d'offre demandé est invalide.",
        });
      }

      values.push(offerType);
      query += ` AND offer_type = $${values.length}`;
    }

    query += ` ORDER BY brand ASC, model ASC`;

    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({
      message: "Une erreur est survenue lors du chargement des véhicules.",
    });
  }
});

module.exports = router;