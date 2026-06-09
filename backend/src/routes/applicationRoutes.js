const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pool = require("../db");

const router = express.Router();

const documentsUploadDir = path.join(__dirname, "../../uploads/documents");

if (!fs.existsSync(documentsUploadDir)) {
  fs.mkdirSync(documentsUploadDir, { recursive: true });
}

const allowedDocumentMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

const storage = multer.diskStorage({
  destination: documentsUploadDir,
  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    callback(null, `document-${uniqueSuffix}${extension}`);
  },
});

const uploadDocument = multer({
  storage,
  fileFilter: (req, file, callback) => {
    if (!allowedDocumentMimeTypes.includes(file.mimetype)) {
      return callback(new Error("FORMAT_INVALIDE"));
    }

    callback(null, true);
  },
});

async function findAdminUser(adminUserId) {
  if (!adminUserId) {
    return null;
  }

  const result = await pool.query(
    "SELECT id, role FROM users WHERE id = $1",
    [adminUserId]
  );

  return result.rows[0] || null;
}

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

    const isOfferTypeCompatible =
      vehicle.offer_type === offerType || vehicle.offer_type === "both";

    if (!isOfferTypeCompatible) {
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

router.get("/admin", async (req, res) => {
  try {
    const adminUser = await findAdminUser(req.query.adminUserId);

    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        message: "Accès réservé aux administrateurs.",
      });
    }

    const applicationsResult = await pool.query(`
      SELECT
        applications.id,
        applications.user_id,
        applications.vehicle_id,
        applications.offer_type,
        applications.phone,
        applications.message,
        applications.status,
        applications.created_at,
        users.first_name,
        users.last_name,
        users.email,
        vehicles.brand,
        vehicles.model,
        vehicles.price,
        vehicles.image_url
      FROM applications
      JOIN users ON users.id = applications.user_id
      JOIN vehicles ON vehicles.id = applications.vehicle_id
      ORDER BY applications.created_at DESC
    `);

    res.status(200).json(applicationsResult.rows);
  } catch (error) {
    console.error("Error fetching admin applications:", error);
    res.status(500).json({
      message: "Une erreur est survenue lors du chargement des dossiers.",
    });
  }
});

router.get("/admin/:applicationId", async (req, res) => {
  try {
    const adminUser = await findAdminUser(req.query.adminUserId);

    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        message: "Accès réservé aux administrateurs.",
      });
    }

    const applicationResult = await pool.query(
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
        users.first_name,
        users.last_name,
        users.email,
        vehicles.brand,
        vehicles.model,
        vehicles.price,
        vehicles.image_url
      FROM applications
      JOIN users ON users.id = applications.user_id
      JOIN vehicles ON vehicles.id = applications.vehicle_id
      WHERE applications.id = $1
      `,
      [req.params.applicationId]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({
        message: "Dossier introuvable.",
      });
    }

    res.status(200).json(applicationResult.rows[0]);
  } catch (error) {
    console.error("Error fetching admin application detail:", error);
    res.status(500).json({
      message: "Une erreur est survenue lors du chargement du dossier.",
    });
  }
});

router.patch("/admin/:applicationId/status", async (req, res) => {
  try {
    const { adminUserId, status } = req.body;

    const adminUser = await findAdminUser(adminUserId);

    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        message: "Accès réservé aux administrateurs.",
      });
    }

    const validStatuses = ["en_attente", "en_cours", "valide", "refuse"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Le statut demandé est invalide.",
      });
    }

    const updatedApplication = await pool.query(
      `
      UPDATE applications
      SET status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, user_id, vehicle_id, offer_type, phone, message, status, created_at, updated_at
      `,
      [status, req.params.applicationId]
    );

    if (updatedApplication.rows.length === 0) {
      return res.status(404).json({
        message: "Dossier introuvable.",
      });
    }

    res.status(200).json({
      message: "Statut du dossier mis à jour avec succès.",
      application: updatedApplication.rows[0],
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({
      message: "Une erreur est survenue lors de la mise à jour du statut.",
    });
  }
});

router.post(
  "/:applicationId/documents",
  uploadDocument.single("document"),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(400).json({
          message: "L'utilisateur doit être renseigné.",
        });
      }

      const applicationResult = await pool.query(
        "SELECT id, user_id FROM applications WHERE id = $1",
        [applicationId]
      );

      if (applicationResult.rows.length === 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(404).json({
          message: "Dossier introuvable.",
        });
      }

      const application = applicationResult.rows[0];

      if (Number(application.user_id) !== Number(userId)) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(403).json({
          message: "Ce dossier n'appartient pas à cet utilisateur.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Aucun document n'a été envoyé.",
        });
      }

      const documentResult = await pool.query(
        `
        INSERT INTO application_documents (
          application_id,
          original_name,
          file_name,
          mime_type,
          file_path,
          file_size
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, application_id, original_name, file_name, mime_type, file_path, file_size, created_at
        `,
        [
          applicationId,
          req.file.originalname,
          req.file.filename,
          req.file.mimetype,
          req.file.path,
          req.file.size,
        ]
      );

      res.status(201).json({
        message: "Document envoyé avec succès.",
        document: documentResult.rows[0],
      });
    } catch (error) {
      console.error("Error uploading document:", error);

      res.status(500).json({
        message: "Une erreur est survenue lors de l'envoi du document.",
      });
    }
  }
);

router.get("/:applicationId/documents", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "L'utilisateur doit être renseigné.",
      });
    }

    const applicationResult = await pool.query(
      "SELECT id, user_id FROM applications WHERE id = $1",
      [applicationId]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({
        message: "Dossier introuvable.",
      });
    }

    const application = applicationResult.rows[0];

    if (Number(application.user_id) !== Number(userId)) {
      return res.status(403).json({
        message: "Ce dossier n'appartient pas à cet utilisateur.",
      });
    }

    const documentsResult = await pool.query(
      `
      SELECT id, application_id, original_name, file_name, mime_type, file_size, created_at
      FROM application_documents
      WHERE application_id = $1
      ORDER BY created_at DESC
      `,
      [applicationId]
    );

    res.status(200).json(documentsResult.rows);
  } catch (error) {
    console.error("Error fetching documents:", error);

    res.status(500).json({
      message: "Une erreur est survenue lors du chargement des documents.",
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

router.use((error, req, res, next) => {
  if (error.message === "FORMAT_INVALIDE") {
    return res.status(400).json({
      message: "Format de document non autorisé.",
    });
  }

  next(error);
});

module.exports = router;