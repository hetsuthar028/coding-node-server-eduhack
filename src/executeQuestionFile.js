const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const executeQuestionFile = async (filePath, questionId) => {
    return new Promise(async (resolve, reject) => {
        console.log("Question ID IN EXEC", questionId)
        await axios.get(`http://localhost:9200/api/coding/get/question?id=${questionId}`)
            .then(async (response) => {
                console.log("Question -- ", response.data.questionData[0]);
                let { testCases, functionName } = response.data.questionData[0];
                
                let codeToAppend = `\nif(require.main === module){
                    let testCases = ${JSON.stringify(testCases)};
                    let testCasesResults = [];

                    testCases.map((testCase, index) => {
                        let output = ${functionName}(...testCase.parameters);

                        if(JSON.stringify(output) === JSON.stringify(testCase.output)){
                            testCasesResults.push({success: true, programOutput: output});
                        } else {
                            testCasesResults.push({success: false, programOutput: output, expectedOutput: testCase.output});
                        }
                    })
                    console.log(testCasesResults);
                }`
                try{
                    await fs.appendFileSync(filePath, codeToAppend);
                } catch(err){
                    console.log("Appending", err);
                    return reject({success: false, error: "Error appending prebuilt content!"})
                }

                exec(`node ${filePath}`,
                    (error, stdout, stderr) => {
                        error && reject({error, stderr})
                        stderr && reject({stderr})
                        resolve(stdout)
                    })
            
            }).catch((err) => {
                console.log("Exe Question", err);
                return reject({err});
            });
    })
}

module.exports = {
    executeQuestionFile,
}