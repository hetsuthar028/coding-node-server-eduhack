const { exec } = require('child_process')
const fs = require('fs');
const path = require('path');

const executeFile = (filePath) => {
    return new Promise((resolve, reject) => {

        // const outputPath = path.join(outputDir, `${jobID}`)
        exec(`node ${filePath}`,
            (error, stdout, stderr) => {
                error && reject({error, stderr})
                stderr && reject({stderr})
                resolve(stdout)
            })
    })
}


module.exports = {
    executeFile,
}