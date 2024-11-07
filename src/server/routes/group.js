import express from 'express';
import {Module} from "../models/Module.js";

const router = express.Router();

router.get("/", async (req, res) => {

    try {
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
router.get('/:groupId', async (req, res) => {
    const { groupId } = req.params; // Retrieve groupId from URL parameters
    try {
        // Find all modules that match the provided groupId
        const modules = await Module.find({ groupId: groupId });
        
        if (!modules || modules.length === 0) {
            return res.status(404).json({ message: 'No modules found for the specified group ID' });
        }
        // Return the found modules as a JSON response
        res.json({
            message: "Successfully retrieved documents",
            data: modules
        });
    } catch (error) {
        console.error("Error fetching modules by groupId:", error);
        res.status(500).json({ message: "Failed to fetch modules by groupId", error: error.message });
    }
});


router.post("/add", async (req, res) => {
    console.log(req.body)
    try {
        
        const { groupId, groupName, moduleName, teamMembers, taskList } = req.body;

        // Check if all required fields are provided
        // if (!moduleName || !groupName || !teamMembers) {
        //     return res.status(400).json({ message: 'All fields are required' });
        // }


        // Create a new document in MongoDB
        const newModule = new Module({
            groupId:"123",
            groupName,
            moduleName,
            teamMembers,
            taskList
        });

        const savedModule = await newModule.save();
        res.status(201).json({
            message: "Successfully added new module",
            data: savedModule
        });
    } catch (e) {
        console.error("Error adding new module:", e);
        res.status(500).send("Failed to add new module: " + e.message);
    }
});

export default router;
