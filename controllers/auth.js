const User = require('../models/User');

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        telephone: user.telephone,
        token
    });
};

// @desc     Register user
// @route    POST /api/v1/auth/register
// @access   Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, telephone, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: `User already exists` 
            });
        }

        const user = await User.create({ name, email, password, telephone, role });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

// @desc     Login user
// @route    POST /api/v1/auth/login
// @access   Public
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            msg: `Please provide an email and password` 
        });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                msg: `Invalid credentials` 
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                msg: `Invalid credentials` 
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: `Server error` 
        });
    }
};

//@desc Log user out / clear cookie
//@route GET /api/v1/auth/logout
//@access Private
exports.logout= async (req,res,next) => {
    res.cookie('token','none',{
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data:{}
    });
};