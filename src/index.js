const express = require('express');
const { generateFile } = require('./generateFile');
const cors = require('cors');
const mongoose = require('mongoose');
const Job = require('../models/Job');
const { addJobToQueue } = require('./jobQueue');
require('dotenv');

const PORT = process.env.SERVER_PORT || 10200;
let path = {
    "runCode": '/api/code/server/node/run',
    "statusCheck": '/api/code/server/status/:jobId',
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

app.post(`${path['runCode']}`, async (req, res)=> {
    let { language = 'js', content, userEmail, questionId } = req.body;
    console.log("Question ID 2", questionId)
    let job;

    try {
        const filePath = await generateFile(content);

        job = await new Job({language, filePath}).save();

        const jobId = job["_id"];
        console.log("Job @RunCode - Just before add to queue", job);
        addJobToQueue({jobId, questionId, userEmail});
        res.status(201).json({success: true, jobId});
    } catch(err){
        return res.status(500).json({success: false, err: JSON.stringify(err)})
    }
        

    // return res.status(200).send({success: true, output: 'received in node server'});
});



app.listen(PORT, () => {
    console.log(`Code Editor - Node server running on ${PORT}`);
})