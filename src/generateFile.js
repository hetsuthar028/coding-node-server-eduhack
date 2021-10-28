const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");

const codesDirPath = path.join(__dirname, "../codefiles");

if (!fs.existsSync(codesDirPath)) {
    fs.mkdirSync(codesDirPath, { recursive: true });
}

const generateFile = async (code) => {
    const jobID = uuid();
    const fileName = `${jobID}.js`;
    const filePath = path.join(codesDirPath, fileName);

    await fs.writeFileSync(filePath, code);
    return filePath;
};

module.exports = {
    generateFile,
};
