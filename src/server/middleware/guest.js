export const guestMiddleware = async (req, res, next) => {
    try {
        // Check for JWT token in cookies or Authorization header
        const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1]

        if (!token) {
            // No token means user is not authenticated - allow access
            return next()
        }

        // If token exists, user is authenticated - redirect them
        return res.status(403).json({
            message: 'Already authenticated',
            redirectTo: '/profile'  // Or dashboard, home, etc.
        })
    } catch (error) {
        // If token verification fails, treat as unauthenticated
        next()
    }
}