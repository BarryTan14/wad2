import express from 'express';
import db from "../db/conn.js";

const router = express.Router();

router.post("/", async (req, res) => {
    console.log("Connecting to the MongoDB collection...");

    try {
        // Connect to the database
        const database = await db.collection("Module");
        const documents = await database.find().toArray();
        // Optional: Fetch collection stats or count if you want to return metadata
        console.log(database)
        res.json({
            message: "Successfully retrieved documents",
            data: documents
        });
        // Send a success message or some metadata
        console.log(documents)
    } catch (e) {
        console.error("Error connecting to MongoDB collection:", e);
        res.status(500).send("Failed to connect to MongoDB collection: " + e.message);
    }
});

export default router;
