
const mongoose = require("mongoose");
const accountModel = require("./models/account.model");
const userModel = require("./models/user.model");

const MONGO_URI = "mongodb+srv://prafullsahu369_db_user:hoCm2wqpmMZp8D7G@backendledger.e502m8b.mongodb.net/backendLedger";

async function checkAccount() {
    try {
        await mongoose.connect(MONGO_URI);
        // Use stdout write to avoid buffering issues or try simple logs
        process.stdout.write("Connected to MongoDB\n");

        const targetId = "69919c01293dbebf58901196";
        process.stdout.write(`Target ID: ${targetId}\n`);

        const user = await userModel.findById(targetId);
        if (user) {
            process.stdout.write(`Step 1: Found USER with ID ${targetId}. Email: ${user.email}\n`);

            // now check if this user has an account
            const account = await accountModel.findOne({ user: targetId });
            if (account) {
                process.stdout.write(`Step 2: Found ACCOUNT for this user! Account ID: ${account._id}\n`);
            } else {
                process.stdout.write(`Step 2: User exists but NO ACCOUNT found for this user.\n`);
            }
        } else {
            process.stdout.write(`Step 1: NO USER found with ID ${targetId}.\n`);

            // check if it is an account ID
            const account = await accountModel.findById(targetId);
            if (account) {
                process.stdout.write(`Step 1b: But found an ACCOUNT with this ID! User: ${account.user}\n`);
            } else {
                process.stdout.write(`Step 1b: And NO ACCOUNT found with this ID either.\n`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.stdout.write("Disconnected\n");
    }
}

checkAccount();
