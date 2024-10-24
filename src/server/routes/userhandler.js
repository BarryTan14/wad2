import express from 'express';
import db from "../db/conn.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/login", async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
        res.send("There are empty fields");
        return;
    }
    try {
        let collection = await db.collection("users");
        let result = await collection.findOne({username: username});
        if (!result) {
            res.send("No user found");
            return;
        }
        bcrypt.compare(password, result.password).then(result => {
            if (result)
                res.send("logged in")
            else
                res.send("wrong login details");
        });
    } catch (e) {
        res.send(e.message);
        return
    }
});

router.post("/register", async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
        res.send("There are empty fields");
        return;
    }
    // use salt to encrypt password
    // unused in favour of bcrypt
    //let salt = cryptoRandomString({length: 10, type:'ascii-printable'});

    //password = password + salt;
    bcrypt.hash(password, 10).then(async hash => {
        try {
            let collection = await db.collection("users");
            let dataToPush = {
                username: username,
                password: hash,
            }
            let result = await collection.insertOne(dataToPush);

            res.send(result);
            return
        } catch (e) {
            if(e.code === 11000){
                res.send("This user already exists");
                return
            }
            res.send(e.message);
            return
        }
    })
});

export default router;
