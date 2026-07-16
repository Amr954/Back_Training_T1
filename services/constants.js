const constantMessages = {
    // Auth
    INVALID_CREDENTIALS: 'Invalid credentials',
    NOT_AUTHORIZED: 'Not authorized to access this route',
    EMAIL_NOT_VERIFIED: 'Please verify your email first',
    INVALID_OTP: 'Invalid or expired OTP',
    INVALID_RESET_TOKEN: 'Invalid or expired reset token',
    OTP_SENT: 'OTP sent to email',
    PASSWORD_RESET_SENT: 'Password reset link sent to email',
    PASSWORD_UPDATED: 'Password updated successfully',
    LOGGED_OUT: 'Logged out successfully',
    SAME_PASSWORD: 'New password must be different from the old password',
    INCORRECT_OLD_PASSWORD: 'Incorrect old password',
    INVALID_TOKEN: 'Invalid token. Please log in again.',
    TOKEN_EXPIRED: 'Your token has expired. Please refresh.',


    // User
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'Email already exists',
    USER_NOT_AUTHORIZED: 'Not authorized to update this user',
    USER_CANNOT_DELETE_SELF: 'You cannot delete your own account',
    USER_CANNOT_CHANGE_OWN_ROLE: 'Cannot change your own role',


    // PRODUCT

    PRODUCT_NOT_FOUND: 'Product not found',
    PRODUCT_INACTIVE: 'Inactive Product.',
    PRODUCT_ALREADY_REVIEWED: 'Product already reviewed once before.',
    PRODUCT_SKU_CHECK:'Product with same sku already exist',
    NOT_ENOUGH_STOCK:'Items in stock not enough.',
    // Reviews
    REVIEW_NOT_FOUND: 'Review not found',
    NOT_AUTHORIZED_REVIEW: 'Not authorized to delete this review',
    
    // CART
    CART_CREATED: 'Cart created successfully!',
    CART_NOT_FOUND: 'Cart not found',
    PRODUCT_ALREADY_EXIST: 'Product already exist in cart.',

    // WISHLIST
    WISHLIST_NOT_FOUND: 'WishList not found',
    PRODUCT_IN_WISHLIST: 'Product already exist in wishlist.',
}


module.exports = constantMessages