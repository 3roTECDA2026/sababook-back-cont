export const authorizeRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    // req.user normalmente proviene de tu middleware de autenticación (JWT/Sesión)
    if (!req.user || !rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado: No tenés permisos para realizar esta acción'
      });
    }
    next(); // Si es Admin, lo deja pasar
  };
};