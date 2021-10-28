const express = require('express');
const { executeFile } = require('./executeJS');
const { generateFile } = require('./generateFile');
const cors = require('cors');
const mongoose = require('mongoose');
const Job = require('../models/Job');
require('dotenv');

const PORT = process.env.SERVER_PORT || 10200;
let path = {
    "run": '/api/code/server/node/run',
    "statusCheck": '/api/code/server/status/:jobId'
}

mongoose.connect('mongodb://localhost/eduhack-compiler',   {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err) => {
    err && console.error(err);
    console.log("Succesfully connected to MongoDB database")
} )

const db = mongoose.connection;


const app = express();
app.use(express.urlencoded({extended: true}))
app.use(express.json());
app.use(cors())



app.get(`${path['statusCheck']}`, async (req, res) => {
    const jobId = req.params.jobId;
    console.log("Status Requested", jobId);

    if(jobId === undefined){
        return res.status(400).json({success: false, error: "Missing id in params"});
    }

    console.log(jobId);
    try{
        const job = await Job.findById(jobId);

        if(job === undefined){
            return res.status(404).json({success: false, error: 'Invalid job id'});
        }

        return res.status(200).json({success: true, job});

    } catch(err){
        return res.status(400).json({success: false, error: JSON.stringify(err)});
    }
})

app.post(`${path['run']}`, async (req, res)=> {
    let { language = 'js', content } = req.body;

    let job;

    try {
        const filePath = await generateFile(content);

        job = await new Job({language, filePath}).save();

        const jobId = job["_id"];
        console.log(job);
        res.status(201).json({success: true, jobId});
        
        job["startedAt"] = new Date();
        const output = await executeFile(filePath)
        console.log("Job Completed", output)
        job["completedAt"] = new Date();
        job["status"] = "success";
        job["output"] = output;

        await job.save();

        console.log("Complete", job);
        // return res.status(200).send({filePath, output});
    } catch(err){
        job["completedAt"] = new Date();
        job["status"] = "error";
        job["output"] = JSON.stringify(err);

        await job.save();
        console.log("ERR", err)
        console.log("ERROR:::", job);
        // return res.status(500).json({err})
    }

    // return res.status(200).send({success: true, output: 'received in node server'});
});


app.listen(PORT, () => {
    console.log(`Code Editor - Node server running on ${PORT}`);
})