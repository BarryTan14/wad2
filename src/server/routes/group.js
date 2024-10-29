import express from 'express';
import {Module} from "../models/Module.js";

const router = express.Router();

router.post("/", async (req, res) => {
    //console.log("Connecting to the MongoDB collection...");

    try {
        //const user = new User({email, password, username})
        //await user.save()
        // Connect to the database
        //const database = await db.collection("Module");
        //const documents = await database.find().toArray();
        // Optional: Fetch collection stats or count if you want to return metadata
        //console.log(database)
        const Task = await Module.find();
        console.log(Task)
        if (!Task) {
            return res.status(401).json({ message: 'No modules found' })
        }
        res.json({
            message: "Successfully retrieved documents",
            data: Task
        });
        // Send a success message or some metadata
        console.log(Task)
    } catch (e) {
        //console.error("Error connecting to MongoDB collection:", e);
        res.status(500).send("Failed to connect to MongoDB collection: " + e.message);
    }
});

export default router;
