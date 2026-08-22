const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return res.status(400).json({
      message: `Campo "${firstError.path.join(".")}": ${firstError.message}`,
    });
  }

  req.body = result.data;
  next();
};

module.exports = { validate };