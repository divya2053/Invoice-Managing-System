const mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    email: {
        type: String
    },
    password: {
        type: String
    },
    verified: {
        type: String
    },
    role: {
        type: String
    },
    firstLogin: {
        type: Boolean
    },
    firstLogin:{
        type:Boolean
    },
    isLinkValid:{
        type:Boolean
    },
    resetLink : {
        type:String
    }
});

mongoose.model("User", userSchema);
