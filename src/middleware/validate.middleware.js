export const validateSchema = (schema) => (req, res, next) => {
  // safeParse revisa si lo que envió el cliente (req.body) cumple la regla
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Si la validación falla, detiene la petición y devuelve un error 400
    return res.status(400).json({
      error: 'Datos inválidos o incompletos',
      detalles: result.error.flatten().fieldErrors
    });
  }

  // Si todo está bien, limpia req.body dejando SOLO los campos permitidos y continúa (next)
  req.body = result.data;
  next();
};