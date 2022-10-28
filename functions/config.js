const fs = require("fs");
const YAML = require("yaml");

const configFile = YAML.parse(fs.readFileSync(__dirname+"/../config.yml", "utf-8"));
//TODO add verifications, for now just making it working is fine
if (configFile.RPC.token === "env") configFile.RPC.token = process.env.TOKEN ?? "";
global.configParsed = {};
global.configParsed.canUpload = configFile.RPC.clientId !== "657893063875624961" && configFile.RPC.token !== "" && configFile.RPC.artworkUpload === true || configFile.forceImage === true;
global.config = configFile;