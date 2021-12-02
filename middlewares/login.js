


var middleFunc = function (req, res, next) {

    console.log("Middle Ware Running " + req.session.cookie.maxAge);
    // console.log(req.session);

    if (req.session.isLogin == 1) {
        // req.session.reload();
        next();
    } else {
        console.log(req.session.isLogin);
        res.redirect("/");
    }
}

module.exports = middleFunc;