const express = require("express");
const pool = require("../db");
const { authenticateToken, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

const validOfferTypes = ["purchase", "rental", "both"];

function validateVehiclePayload(body) {
  const {
    brand,
    model,
    price,
    offerType,
    isAvailable = true,
    imageUrl = null,
  } = body;

  if (!brand || !model || price === undefined || !offerType) {
    return {
      isValid: false,
      message: "Les champs marque, modèle, prix et type d'offre sont obligatoires.",
    };
  }

  if (!validOfferTypes.includes(offerType)) {
    return {
      isValid: false,
      message: "Le type d'offre est invalide.",
    };
  }

  if (Number(price) < 0) {
    return {
      isValid: false,
      message: "Le prix doit être supérieur ou égal à 0.",
    };
  }

  if (typeof isAvailable !== "boolean") {
    return {
      isValid: false,
      message: "La disponibilité doit être un booléen.",
    };
  }

  return {
    isValid: true,
    data: {
      brand: brand.trim(),
      model: model.trim(),
      price: Number(price),
      offerType,
      isAvailable,
      imageUrl,
    },
  };
}

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
      query += ` AND (offer_type = $${values.length} OR offer_type = 'both')`;
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

router.get("/admin", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, brand, model, price, offer_type, is_available, image_url
      FROM vehicles
      ORDER BY brand ASC, model ASC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching admin vehicles:", error);
    res.status(500).json({
      message: "Une erreur est survenue lors du chargement des véhicules.",
    });
  }
});

router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validation = validateVehiclePayload(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const { brand, model, price, offerType, isAvailable, imageUrl } = validation.data;

    const result = await pool.query(
      `
        INSERT INTO vehicles (brand, model, price, offer_type, is_available, image_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, brand, model, price, offer_type, is_available, image_url
      `,
      [brand, model, price, offerType, isAvailable, imageUrl]
    );

    res.status(201).json({
      message: "Véhicule créé avec succès.",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({
      message: "Une erreur est survenue lors de la création du véhicule.",
    });
  }
});

router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validation = validateVehiclePayload(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const { brand, model, price, offerType, isAvailable, imageUrl } = validation.data;

    const result = await pool.query(
      `
        UPDATE vehicles
        SET brand = $1,
            model = $2,
            price = $3,
            offer_type = $4,
            is_available = $5,
            image_url = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, brand, model, price, offer_type, is_available, image_url
      `,
      [brand, model, price, offerType, isAvailable, imageUrl, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Véhicule introuvable.",
      });
    }

    res.status(200).json({
      message: "Véhicule modifié avec succès.",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({
      message: "Une erreur est survenue lors de la modification du véhicule.",
    });
  }
});

module.exports = router;