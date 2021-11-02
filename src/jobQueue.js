const Queue = require('bull');
const jobQueue = new Queue('job-queue');
const NUM_WORKERS = 5;
const { executeFile } = require('./executeJS');
const { executeQuestionFile } = require('./executeQuestionFile');
const Job = require('../models/Job');

jobQueue.process(NUM_WORKERS, async ({data}) => {
    console.log(data);
    const {id: jobId, questionId} = data;
    // const job = await Job.find({_id: data.jobId});
    const job = await Job.findById(data.jobId);
    console.log("JOB - ", job);
    if(job === undefined || job == null){
        throw Error('job not found');
    } 
    console.log("Fetched the job", data.jobId, job);

    try{
        job["startedAt"] = new Date();
        let output;

        if(data.questionId === undefined || !data.questionId){
            console.log("Exec File", data.questionId, job.filePath)
            output = await executeFile(job.filePath)
        } else {
            console.log("Exec Question File", data.questionId, job.filePath)
            output = await executeQuestionFile(job.filePath, data.questionId);
        }

        console.log("Job Completed", output)
        job["completedAt"] = new Date();
        job["status"] = "success";
        job["output"] = output;

        await job.save();
        return true;
        // return res.status(200).send({filePath, output});
    } catch(err){
        job["completedAt"] = new Date();
        job["status"] = "error";
        job["output"] = JSON.stringify(err);

        console.log("Job error:::", err);
        await job.save();
        // return res.status(500).json({err})
    }

    
});

jobQueue.on('failed', (error) => {
    // console.log("JOb ERROR", error);
    console.log(error.data.id, "failed", error.failedReason);
});


const addJobToQueue = async(jobId) => {
    await jobQueue.add(jobId);

};


module.exports = {
    addJobToQueue
}