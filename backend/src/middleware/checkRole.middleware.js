export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Safety Check: Ensure 'protect' middleware ran first
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: "Authentication Error: User not found in request." 
                });
            }

            // Check if the user's role is in the allowed list
            if (!allowedRoles.includes(req.user.role)) {
                console.warn(`[Security] Unauthorized access attempt by user: ${req.user.username} (Role: ${req.user.role})`);
                
                return res.status(403).json({ 
                    success: false,
                    message: `Access Denied: Role '${req.user.role}' is not authorized to perform this action.` 
                });
            }

            next(); // User is authorized, proceed

        } catch (error) {
            console.error("[Middleware Error] Role check failed:", error);
            res.status(500).json({ 
                success: false,
                message: "Server Error during authorization check." 
            });
        }
    };
};