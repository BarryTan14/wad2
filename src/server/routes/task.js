import express from 'express';
import {Task} from "../models/Task.js";

const router = express.Router();

router.get("/", async (req, res) => {

    try {
        const newTask = await Task.find();
        console.log(newTask)
        if (!newTask) {
            return res.status(401).json({ message: 'No tasks found' })
        }
        res.json({
            message: "Successfully retrieved documents",
            data: newTask
        });
        // Send a success message or some metadata
        console.log(newTask)
    } catch (e) {
        //console.error("Error connecting to MongoDB collection:", e);
        res.status(500).send("Failed to connect to MongoDB collection: " + e.message);
    }
});
router.get('/:taskId', async (req, res) => {
    const { taskId } = req.params; // Retrieve groupId from URL parameters
    try {
        // Find all modules that match the provided groupId
        const Task = await Task.find({ taskId: taskId });
        
        if (!Task || Task.length === 0) {
            return res.status(404).json({ message: 'No task found for the specified module Id' });
        }
        // Return the found modules as a JSON response
        res.json({
            message: "Successfully retrieved documents",
            data: Task
        });
    } catch (error) {
        console.error("Error fetching modules by groupId:", error);
        res.status(500).json({ message: "Failed to fetch task by module Id", error: error.message });
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
