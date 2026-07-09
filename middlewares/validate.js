function validate(schema) {
  return function (req, res, next) {
    const result = schema.validate(req.body, {
      abortEarly: false,  
      stripUnknown: true 
    });
    if (result.error) {
      const errorMessages = [];
      for (let i = 0; i < result.error.details.length; i++) {
        errorMessages.push(result.error.details[i].message);
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
       
      });
    }

    req.body =result.value;
    next();
  };
}

export default validate;