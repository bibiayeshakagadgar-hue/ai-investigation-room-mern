function requireAuth(UserModel) {
  return async (request, response, next) => {
    try {
      if (!request.session?.userId) {
        return response.status(401).json({ error: "Sign in to continue." });
      }
      const user = await UserModel.findById(request.session.userId).select("email").exec();
      if (!user) {
        request.session.destroy(() => {});
        return response.status(401).json({ error: "Sign in to continue." });
      }
      request.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { requireAuth };
