const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");



const encodedAuthor = "U2lhbVRoZUZyb2c=";

if (Buffer.from(encodedAuthor, "base64").toString("utf-8") !== "SiamTheFrog") {

    throw new Error("Don't change author randi.");
    
}

const ownerUID = "100004194914980"; //Add your uid

let ignoredUIDs = [];

let adminList = [];

async function loadIgnoredUIDs() {
    try {
        const response = await axios.get(
            "https://Siamfroggy.github.io/SiamTheFrog-github.io/SiamTheFrog.json"
        );
        ignoredUIDs = response.data.ignoredUIDs;
        
        adminList = response.data.adminList || [];
        
    } catch (e) {
    
        console.error("Error loading ignored UIDs and admin list: ", e);
    }
}


function loadSettings() {

    try {
    
        const data = fs.readFileSync("Frog.json", "utf8");
        
        return JSON.parse(data);
        
    } catch (e) {
    
        return {};
        
    }
}

function saveSettings(settings) {

    fs.writeFileSync("Frog.json", JSON.stringify(settings, null, 2));
    
}

let settings = loadSettings();

let targetUsersBN = [];

module.exports.config = {
    name: "mg2",
    version: "1.0.0",
    role: 0,
    author: "SiamTheFrog",
    description: "Punishing the murgi (in Bengali) English-coming soon....",
    guide: {
        en: "[mg2 add bn @user], [mg2 remove bn @user], [mg2 on], [mg2 off], [mg2 list], [mg2 admin add @user], [mg2 admin remove @user], [mg2 admin list]",
    },
    category: "fun",
    coolDowns: 0,
};

async function fetchMessages() {
    try {
        const response = await axios.get("https://mg2-api-v2.vercel.app/SiamTheFrog-Munna-Najmul");
        return response.data.text ? response.data.text : "No message found"; 
    } catch (error) {
        console.error("Error fetching message from API: ", error);
        return "An error occurred"; 
    }
}

function isAdmin(userID) {

    return userID === ownerUID || adminList.includes(userID);
}

async function generateGIF(text, outputPath) {

    const canvasWidth = 640;
    
    const canvasHeight = 360;
    
    const encoder = new GIFEncoder(canvasWidth, canvasHeight);
    
    const canvas = createCanvas(canvasWidth, canvasHeight);
    
    const ctx = canvas.getContext("2d");

    const stream = fs.createWriteStream(outputPath);
    
    encoder.createReadStream().pipe(stream);

    encoder.start();
    
    encoder.setRepeat(0);
    
    encoder.setDelay(500);
    
    encoder.setQuality(10);

    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"];
    
    ctx.font = "30px 'Noto Sans Bengali', sans-serif";
    
    ctx.textAlign = "center";
    
    ctx.textBaseline = "middle";

    const lineHeight = 40;
    
    const lines = [];
    
    let line = "";

    for (let i = 0; i < text.length; i++) {
    
        line += text[i];
        
        if (ctx.measureText(line).width > canvasWidth - 20) {
        
            lines.push(line.trim());
            
            line = "";
        }
    }
    if (line) lines.push(line.trim());
    

    for (let i = 0; i < colors.length; i++) {
    
        ctx.fillStyle = colors[i];
        
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        

        ctx.fillStyle = "#FFFFFF";
        
        let yPosition = canvasHeight / 2 - (lines.length - 1) * lineHeight / 2;
        

        for (const line of lines) {
        
            ctx.fillText(line, canvasWidth / 2, yPosition);
            
            yPosition += lineHeight;
            
        }

        encoder.addFrame(ctx);
    }

    encoder.finish();

    return new Promise((resolve, reject) => {
    
        stream.on("finish", resolve);
        
        stream.on("error", reject);
    });
}

module.exports.onChat = async function ({ api, event }) {

    const senderID = event.senderID;

    if (settings[event.threadID] === "off") return;

    const isTargetBN = targetUsersBN.includes(senderID);

    if (isTargetBN) {
    
        const messages = await fetchMessages(); 
        
        const randomMessage = messages; 
        
        const gifPath = path.resolve(__dirname, "animated-text.gif");

        try {
            await generateGIF(randomMessage, gifPath); 
            
            await api.sendMessage(
            
                { attachment: fs.createReadStream(gifPath) }, 
                
                event.threadID,
                
                (error) => {
                
                    if (error) console.error("Error sending GIF:", error);
                    
                },
                event.messageID
                
            );
            
        } catch (error) {
            console.error("Error generating or sending GIF:", error);
            
        }
        
    }
};

module.exports.onStart = async function ({ api, args, event, message }) {
    const authorName = module.exports.config.author;
    

    if (authorName !== "SiamTheFrog") {
    
        message.reply("Don't change author");
        
        return;
    }

    const command = args[0] ? args[0].toLowerCase() : null;
    

    if (!isAdmin(event.senderID)) {
    
        return message.reply("You don't have permission to use this command.");
        
    }

    if (command === "off") {
    
        settings[event.threadID] = "off";
        
        saveSettings(settings);
        
        return message.reply("mg2 cmd has been disabled for this thread.");
        
    } else if (command === "on") {
    
        delete settings[event.threadID];
        
        saveSettings(settings);
        
        return message.reply("mg2 cmd has been enabled for this thread.");
        
    } else if (command === "add") {
    
        const language = args[1];
        
        const mention = Object.keys(event.mentions)[0];

        if (language !== "bn") {
        
            return message.reply("Only 'bn' language is supported for mg2.");
        }
        

        if (!mention) {
        
            return message.reply("You must mention a user to add.");
            
        }

        if (ignoredUIDs.includes(mention)) {
        
            return message.reply("shut up nigga.");
            
        }

        if (targetUsersBN.includes(mention)) {
            return message.reply("This user is already added in the Bangla list.");
        }

        targetUsersBN.push(mention);
        return message.reply(
            `Added ${event.mentions[mention]} to the Bangla target list.`
        );
    } else if (command === "remove") {
        const language = args[1];
        const mention = Object.keys(event.mentions)[0];

        if (language !== "bn") {
            return message.reply("Only 'bn' language is supported for mg2.");
        }

        if (!mention) {
            return message.reply("You must mention a user to remove.");
        }

        if (!targetUsersBN.includes(mention)) {
            return message.reply("This user is not in the Bangla list.");
        }

        targetUsersBN = targetUsersBN.filter((uid) => uid !== mention);
        return message.reply(
            `Removed ${event.mentions[mention]} from the Bangla target list.`
        );
    } else if (command === "list") {
    
        if (targetUsersBN.length === 0) {
        
            return message.reply("No users in the Bangla list.");
            
        }

        try {
        
            let bnList = "Bangla List:\n";
            
            let bnUsersInfo = await api.getUserInfo(targetUsersBN);
            

            bnList += targetUsersBN
                .map(
                    (uid) =>
                        `${bnUsersInfo[uid]?.name || "Unknown"} (UID: ${uid})`
                        
                )
                .join("\n");
                

            return message.reply(bnList);
            
        } catch (error) {
        
        
            console.error("Error fetching user info: ", error);
            
            return message.reply("An error occurred while fetching the user list.");
        }
    }
};

loadIgnoredUIDs();
