var validator = function (req, res, next) {


    if (req.session.role == 'admin') {
        // req.session.reload();
        next();
    } else {
        res.render("error",{
            msg:"Not Authorized",
            redirect:"/user"
        })
    }
}

module.exports = validator;