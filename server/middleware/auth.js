import jwt from 'jsonwebtoken'

const auth = async (request, response, next) => {
  try {
    const token =
      request.cookies.accessToken ||
      request?.headers?.authorization?.split(" ")[1];

    if (!token) {
      console.log("❌ No token found in cookies or headers");
      return response.status(401).json({
        message: "Provide token",
        error: true,
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

    if (!decode) {
      console.log("❌ Token verification failed");
      return response.status(401).json({
        message: "unauthorized access",
        error: true,
        success: false,
      });
    }

    request.userId = decode.id;
    
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
    return response.status(401).json({
      message: "Access token expired",
      error: true,
      success: false,
    })
  }
}
}

export default auth