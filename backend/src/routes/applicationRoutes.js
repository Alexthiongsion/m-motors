const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, vehicleId, offerType, phone, message } = req.body;

    if (!userId || !vehicleId || !offerType || !phone) {
      return res.status(400).json({
        message: "Tous les champs obligatoires doivent être renseignés.",
      });
    }

    if (!["purchase", "rental"].includes(offerType)) {
      return res.status(400).json({
        message: "Le type de demande est invalide.",
      });
    }

    const userResult = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    const vehicleResult = await pool.query(
      "SELECT id, offer_type, is_available FROM vehicles WHERE id = $1",
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({
        message: "Véhicule introuvable.",
      });
    }

    const vehicle = vehicleResult.rows[0];

    if (!vehicle.is_available) {
      return res.status(400).json({
        message: "Ce véhicule n'est plus disponible.",
      });
    }

    if (vehicle.offer_type !== offerType) {
      return res.status(400).json({
        message: "Le type de demande ne correspond pas à l'offre du véhicule.",
      });
    }

    const applicationResult = await pool.query(
      `
      INSERT INTO applications (user_id, vehicle_id, offer_type, phone, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, vehicle_id, offer_type, phone, message, status, created_at
      `,
      [userId, vehicleId, offerType, phone.trim(), message?.trim() || null]
    );

    res.status(201).json({
      message: "Dossier déposé avec succès.",
      application: applicationResult.rows[0],
    });
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({
      message: "Une erreur est survenue lors du dépôt du dossier.",
    });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userResult = await pool.query("SELECT id FROM users WHERE id = $1", [
      userId,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    const applicationsResult = await pool.query(
      `
      SELECT
        applications.id,
        applications.user_id,
        applications.vehicle_id,
        applications.offer_type,
        applications.phone,
        applications.message,
        applications.status,
        applications.created_at,
        vehicles.brand,
        vehicles.model,
        vehicles.price,
        vehicles.image_url
      FROM applications
      JOIN vehicles ON vehicles.id = applications.vehicle_id
      WHERE applications.user_id = $1
      ORDER BY applications.created_at DESC
      `,
      [userId]
    );

    res.status(200).json(applicationsResult.rows);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      message: "Une erreur est survenue lors du chargement des dossiers.",
    });
  }
});

module.exports = router;
