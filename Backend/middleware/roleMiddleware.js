exports.authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is attached by the authMiddleware (protect) we just built
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Role '${req.user.role}' is not allowed here.`
            });
        }
        next(); // Role matches, let them through
    };
};